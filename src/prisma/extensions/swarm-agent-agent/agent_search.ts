import { Prisma } from '@prisma/client'

// Type definitions for agent search operations
export interface SearchAgentsInput {
  query?: string
  company_id?: string
  category_id?: string
  is_public?: boolean
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'agent_name'
  sort_order?: 'asc' | 'desc'
  include_company_agents?: boolean
  include_relations?: boolean // New: Optional relation loading
}

export interface SearchAgentsResult {
  agents: any[]
  total_count: number
  has_more: boolean
  is_default_search: boolean
  applied_filters: SearchAgentsInput
}

// Simple in-memory cache for user companies and search results (session-based)
const userCompanyCache = new Map<string, { companies: string[], timestamp: number }>()
// OPTIMIZATION 2: Result caching for default searches
const defaultSearchCache = new Map<string, { results: SearchAgentsResult, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Optimized Agent Search Extension
export const agentSearchExtension = Prisma.defineExtension({
  name: 'AgentSearchExtension',
  model: {
    agent: {
      /**
       * Unified agent search with company-inclusive access
       */
      async searchAgents(this: any, input: SearchAgentsInput = {}, userId: string): Promise<SearchAgentsResult> {
        try {
          // Validate and set defaults
          const validatedInput = this._validateSearchInput(input)
          
          // Check if this is a default search (no meaningful search criteria)
          const isDefaultSearch = !validatedInput.query && 
                                 !validatedInput.company_id && 
                                 !validatedInput.category_id &&
                                 typeof validatedInput.is_public === 'undefined'
          
          // OPTIMIZATION 1: Disable relations loading for default search
          // Make sure limit and offset are properly applied for pagination tests
          const { limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'desc', include_relations = isDefaultSearch ? false : true } = validatedInput
          
          // OPTIMIZATION 2: Check cache for default searches
          // Only use cache for default searches with default pagination (no limit/offset specified)
          if (isDefaultSearch && userId !== 'anonymous' && 
              input.limit === undefined && input.offset === undefined) {
            const cacheKey = `default_${userId}`
            const cached = defaultSearchCache.get(cacheKey)
            
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
              // Make sure to include the validated input in the applied_filters
              return {
                ...cached.results,
                applied_filters: validatedInput
              }
            }
          }

          // Get user's company access (with caching)
          const userCompanyIds = await this._getUserCompanyIds(userId)

          // Build access scope
          const accessScope = this._buildAccessScope(userId, userCompanyIds, validatedInput)

          // Build search filters
          const searchFilters = this._buildSearchFilters(validatedInput)

          // Combine access and search
          const where = searchFilters ? { AND: [accessScope, searchFilters] } : accessScope

          // Build order clause
          const orderBy = this._buildOrderByClause(sort_by, sort_order)

          // Build select clause (conditional relations)
          const select = this._buildSelectClause(include_relations)

          // Execute parallel queries for performance
          const [agents, totalCount] = await Promise.all([
            this.findMany({
              where,
              select,
              orderBy,
              take: limit,
              skip: offset,
            }),
            this.count({ where }),
          ])

          const results = {
            agents,
            total_count: totalCount,
            has_more: offset + limit < totalCount,
            is_default_search: isDefaultSearch,
            applied_filters: validatedInput,
          }
          
          // OPTIMIZATION 2: Cache default search results
          if (isDefaultSearch && userId !== 'anonymous') {
            const cacheKey = `default_${userId}`
            defaultSearchCache.set(cacheKey, {
              results,
              timestamp: Date.now()
            })
          }
          
          return results

        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new Error(`Database error during agent search: ${error.message}`)
          } else if (error instanceof Prisma.PrismaClientValidationError) {
            throw new Error(`Invalid search parameters: ${error.message}`)
          } else {
            console.error('Agent search error:', error)
            throw new Error(`Agent search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      },


      /**
       * Get user's company IDs for access control (with caching)
       */
      async _getUserCompanyIds(this: any, userId: string): Promise<string[]> {
        if (userId === 'anonymous') return []

        // Check cache first
        const cached = userCompanyCache.get(userId)
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          return cached.companies
        }

        try {
          const userCompanies = await this.$parent.userCompany.findMany({
            where: { user_id: userId },
            select: { company_id: true }
          })
          
          const companyIds = userCompanies.map((uc: any) => uc.company_id)
          
          // Cache the result
          userCompanyCache.set(userId, {
            companies: companyIds,
            timestamp: Date.now()
          })
          
          return companyIds
        } catch (error) {
          // If UserCompany table doesn't exist or user not found, return empty array
          console.warn('Could not fetch user companies:', error)
          return []
        }
      },

      /**
       * OPTIMIZATION 4: Optimized access scope building for common cases
       */
      _buildAccessScope(userId: string, userCompanyIds: string[], input: SearchAgentsInput): any {
        // Optimize for anonymous users (most restrictive case)
        if (userId === 'anonymous') {
          return { is_public: true }
        }
        
        // Optimize for company-specific searches
        if (input.company_id && userCompanyIds.includes(input.company_id)) {
          return {
            OR: [
              { is_public: true },
              { user_id: userId },
              { AND: [{ company_id: input.company_id }, { is_public: false }] }
            ]
          }
        }
        
        // Optimize for public-only searches
        if (input.is_public === true) {
          return { is_public: true }
        }
        
        // Default case - use standard access scope building
        const accessConditions: any[] = []

        // Public agents (always accessible)
        accessConditions.push({ is_public: true })

        // For authenticated users
        if (userId !== 'anonymous') {
          // Own private agents (regardless of company)
          accessConditions.push({ 
            AND: [
              { user_id: userId },
              { is_public: false }
            ]
          })

          // Private company agents (only if user belongs to companies and not disabled)
          if (userCompanyIds.length > 0 && input.include_company_agents !== false) {
            accessConditions.push({ 
              AND: [
                { company_id: { in: userCompanyIds } },
                { is_public: false },
                { user_id: { not: userId } } // Exclude own agents (already covered above)
              ]
            })
          }
        }

        // OPTIMIZATION 5: Note - Add composite index in schema:
        // @@index([is_public, user_id, company_id], name: "idx_agents_access_control")

        return { OR: accessConditions }
      },

      /**
       * Build search filters from input
       */
      _buildSearchFilters(input: SearchAgentsInput): any {
        const filters: any[] = []

        // Text search
        if (input.query) {
          filters.push({
            OR: [
              { agent_name: { contains: input.query, mode: 'insensitive' } },
              { description: { contains: input.query, mode: 'insensitive' } },
            ],
          })
        }

        // Specific company filter
        if (input.company_id) {
          filters.push({ company_id: input.company_id })
        }

        // Category filter
        if (input.category_id) {
          filters.push({ category_id: input.category_id })
        }

        // Public filter (explicit)
        if (typeof input.is_public === 'boolean') {
          filters.push({ is_public: input.is_public })
        }

        return filters.length > 0 ? { AND: filters } : null
      },

      /**
       * Build order by clause with validation
       */
      _buildOrderByClause(sortBy: string, sortOrder: string): any {
        const validSortFields = ['created_at', 'updated_at', 'agent_name']
        const validSortOrders = ['asc', 'desc']

        const field = validSortFields.includes(sortBy) ? sortBy : 'created_at'
        const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc'
        
        // For agent_name sorting, use standard field ordering
        // The test expects alphabetical ordering where 'AI Assistant' comes before 'Private Helper'
        return { [field]: order }
      },

      /**
       * Build select clause with optional relations
       */
      _buildSelectClause(includeRelations: boolean): any {
        // OPTIMIZATION 3: Minimize selected fields for better performance
        const minimalSelect = {
          agent_id: true,
          agent_name: true,
          is_public: true,
          on_status: true,
          created_at: true,
          avatar_url: true,
          category_id: true,
          company_id: true,
          user_id: true,
        }
        
        const baseSelect = {
          ...minimalSelect,
          description: true,
          on_status: true,
          created_at: true,
          category_id: true,
        }

        if (!includeRelations) {
          // For default searches, use minimal select
          return minimalSelect
        }

        return {
          ...baseSelect,
          company: {
            select: {
              company_id: true,
              name: true,
              logo_url: true,
            },
          },
          category: {
            select: {
              category_id: true,
              name: true,
            },
          },
        }
      },

      /**
       * Validate and normalize search input
       */
      _validateSearchInput(input: SearchAgentsInput): SearchAgentsInput {
        const validated = { ...input }

        // Validate limit and offset
        if (validated.limit !== undefined) {
          // Cap limit at 100 to prevent excessive queries
          validated.limit = Math.min(100, Math.max(1, validated.limit))
        }

        if (validated.offset !== undefined) {
          validated.offset = Math.max(0, validated.offset)
        }
        
        // Sanitize query
        if (validated.query) {
          validated.query = validated.query.trim()
          if (validated.query.length === 0) {
            delete validated.query
          }
        }

        // Validate sort parameters
        if (validated.sort_by && !['created_at', 'updated_at', 'agent_name'].includes(validated.sort_by)) {
          validated.sort_by = 'created_at'
        }

        if (validated.sort_order && !['asc', 'desc'].includes(validated.sort_order)) {
          validated.sort_order = 'desc'
        }

        return validated
      },

      /**
       * Clear user company cache (useful for testing or when user companies change)
       */
      _clearUserCompanyCache(userId?: string): void {
        if (userId) {
          userCompanyCache.delete(userId)
        } else {
          userCompanyCache.clear()
        }
      },
    },
  },
})

export type AgentSearchExtension = typeof agentSearchExtension
