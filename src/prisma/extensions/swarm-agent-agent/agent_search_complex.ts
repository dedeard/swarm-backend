import { Prisma } from '@prisma/client'

// Type definitions for agent search operations
export interface SearchAgentsInput {
  query?: string
  company_id?: string
  category_id?: string
  is_public?: boolean
  user_id?: string
  tags?: string[]
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'agent_name' | 'popularity'
  sort_order?: 'asc' | 'desc'
}

export interface SearchAgentsResult {
  agents: any[]
  total_count: number
  has_more: boolean
  filters_applied: SearchAgentsInput
}

// Simplified Complex Agent Search Extension
export const agentSearchExtension = Prisma.defineExtension({
  name: 'AgentSearchExtension',
  model: {
    agent: {
      /**
       * Search agents with advanced filtering
       */
      async searchAgents(this: any, input: SearchAgentsInput = {}, userId: string): Promise<SearchAgentsResult> {
        // For simplicity, we'll use a direct approach without querying for the role
        // In a real implementation, you would get the role from the database or auth context
        const userRole = userId === 'anonymous' ? 'swarm_public' : 'swarm_user'

        // Process input based on role
        const secureSearchInput = this.processSearchInput(input, userRole, userId)

        // Execute search query with appropriate filters
        const { limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = secureSearchInput

        // Build where clause
        const where = this.buildSearchWhereClause(secureSearchInput, userRole, userId)

        // Build order by clause
        const orderBy = this.buildOrderByClause(sort_by, sort_order)

        // Execute search query
        const [agents, totalCount] = await Promise.all([
          this.findMany({
            where,
            include: {
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
                  description: true,
                },
              },
              // Remove the user include as it's not available in the Agent model
            },
            orderBy,
            take: limit,
            skip: offset,
          }),
          this.count({ where }),
        ])

        return {
          agents,
          total_count: totalCount,
          has_more: offset + limit < totalCount,
          filters_applied: secureSearchInput,
        }
      },

      /**
       * Search public agents (accessible to all roles including anonymous)
       */
      async searchPublicAgents(this: any, input: Omit<SearchAgentsInput, 'user_id'> = {}): Promise<SearchAgentsResult> {
        const { limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = input

        // Force public-only search
        const where: any = {
          is_public: true,
        }

        // Apply additional filters
        if (input.query) {
          where.OR = [
            { agent_name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
          ]
        }

        if (input.company_id) {
          where.company_id = input.company_id
        }

        if (input.category_id) {
          where.category_id = input.category_id
        }

        // Build order by clause
        const orderBy = this.buildOrderByClause(sort_by, sort_order)

        // Execute search query
        const [agents, totalCount] = await Promise.all([
          this.findMany({
            where,
            include: {
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
                  description: true,
                },
              },
              // Remove the user include as it's not available in the Agent model
            },
            orderBy,
            take: limit,
            skip: offset,
          }),
          this.count({ where }),
        ])

        return {
          agents,
          total_count: totalCount,
          has_more: offset + limit < totalCount,
          filters_applied: { ...input, is_public: true },
        }
      },

      /**
       * Search agents by company
       */
      async searchAgentsByCompany(
        this: any,
        companyId: string,
        searchInput: Omit<SearchAgentsInput, 'company_id'> = {},
        userId: string,
      ): Promise<SearchAgentsResult> {
        // Force company filter
        const input = { ...searchInput, company_id: companyId }

        return await this.searchAgents(input, userId)
      },

      // Helper methods
      processSearchInput(input: SearchAgentsInput, userRole: string, userId: string): SearchAgentsInput {
        const processed = { ...input }

        // For public users, force public-only search
        if (userRole === 'swarm_public') {
          processed.is_public = true
        }

        return processed
      },

      buildSearchWhereClause(input: SearchAgentsInput, userRole: string, userId: string): any {
        const where: any = {}

        // Apply text search
        if (input.query) {
          where.OR = [
            { agent_name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
          ]
        }

        // Apply specific filters
        if (input.company_id) {
          where.company_id = input.company_id
        }

        if (input.category_id) {
          where.category_id = input.category_id
        }

        if (input.user_id) {
          where.user_id = input.user_id
        }

        if (typeof input.is_public === 'boolean') {
          where.is_public = input.is_public
        }

        // Apply role-based access restrictions
        switch (userRole) {
          case 'swarm_user':
            // Can see own agents and public agents
            if (!where.OR) where.OR = []
            where.OR = [...where.OR, { user_id: userId }, { is_public: true }]
            break

          case 'swarm_company_admin':
            // Can see own agents and public agents
            if (!where.OR) where.OR = []
            where.OR = [...where.OR, { user_id: userId }, { is_public: true }]
            break

          case 'swarm_admin':
            // Can see all agents (no additional restrictions)
            break

          default:
            // Default to public only for any other role
            where.is_public = true
            break
        }

        return where
      },

      buildOrderByClause(sortBy?: string, sortOrder?: string): any {
        const validSortFields = ['created_at', 'updated_at', 'agent_name']
        const validSortOrders = ['asc', 'desc']

        const field = sortBy && validSortFields.includes(sortBy) ? sortBy : 'created_at'
        const order = sortOrder && validSortOrders.includes(sortOrder) ? sortOrder : 'desc'

        return { [field]: order }
      },

      /**
       * Get search suggestions based on partial query
       */
      async getSearchSuggestions(this: any, query: string, userId: string, limit: number = 10): Promise<string[]> {
        // For simplicity, we'll use a direct approach without querying for the role
        const userRole = userId === 'anonymous' ? 'swarm_public' : 'swarm_user'

        // Build where clause for suggestions
        const where = this.buildSearchWhereClause({ query }, userRole, userId)

        // Get agent names that match the query
        const agents = await this.findMany({
          where,
          select: {
            agent_name: true,
          },
          take: limit,
          orderBy: {
            agent_name: 'asc',
          },
        })

        return agents.map((agent: any) => agent.agent_name)
      },
    },
  },
})

export type AgentSearchExtension = typeof agentSearchExtension
