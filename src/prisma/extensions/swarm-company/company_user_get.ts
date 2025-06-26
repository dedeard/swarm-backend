/**
 * Prisma Extension for Company User Get Operations
 * Simple company read operations
 */

import { Prisma } from '@prisma/client'

// Type definitions for user retrieval operations
export interface GetCompanyUsersInput {
  company_id: string
  role_filter?: string
  search?: string
  include_inactive?: boolean
  limit?: number
  offset?: number
  sort_by?: 'name' | 'role' | 'joined_date'
  sort_order?: 'asc' | 'desc'
}

export interface GetUserCompaniesInput {
  user_id: string
  include_role_details?: boolean
  active_only?: boolean
}

export interface CompanyMembershipSummary {
  total_companies: number
  admin_companies: number
  member_companies: number
  companies: any[]
}

// Simplified Company User Get Extensions
export const getUserCompanyExtension = Prisma.defineExtension({
  name: 'GetUserCompanyExtension',
  model: {
    userCompany: {
      /**
       * Get all users in a company
       */
      async getCompanyUsers(this: any, input: GetCompanyUsersInput) {
        // Prepare pagination parameters
        const limit = Math.min(input.limit || 50, 100)
        const offset = input.offset || 0

        // Build where clause
        const where: any = {
          company_id: input.company_id,
        }

        // Add role filter
        if (input.role_filter) {
          where.role = {
            role_name: input.role_filter,
          }
        }

        // Get total count
        const totalCount = await this.count({ where })

        // Get users with pagination
        const memberships = await this.findMany({
          where,
          include: {
            role: true,
            company: {
              select: {
                company_id: true,
                name: true,
              },
            },
          },
          orderBy: {
            user_id: input.sort_by === 'name' ? input.sort_order : undefined,
            role_id: input.sort_by === 'role' ? input.sort_order : undefined,
            created_at: input.sort_by === 'joined_date' ? input.sort_order : undefined
          },
          take: limit,
          skip: offset,
        })

        // If search is provided, we need to filter by user details
        // In a real implementation, this would join with user profiles
        let filteredMemberships = memberships
        if (input.search) {
          // This is a simplified search - in practice you'd join with user profiles
          filteredMemberships = memberships.filter((membership: any) =>
            membership.user_id.toLowerCase().includes(input.search!.toLowerCase()),
          )
        }

        return {
          users: filteredMemberships,
          total_count: totalCount,
          has_more: totalCount > offset + filteredMemberships.length,
          company_id: input.company_id,
        }
      },

      /**
       * Get companies for a specific user
       */
      async getUserCompanies(this: any, input: GetUserCompaniesInput) {
        const where: any = {
          user_id: input.user_id,
        }

        const memberships = await this.findMany({
          where,
          include: {
            role: input.include_role_details !== false,
            company: {
              select: {
                company_id: true,
                name: true,
                description: true,
                industry: true,
                logo_url: true,
                created_at: true,
                _count: {
                  select: {
                    user_companies: true,
                    agents: true,
                    tools: true,
                  },
                },
              },
            },
          },
          orderBy: {
            company: {
              name: 'asc',
            },
          },
        })

        return {
          memberships,
          total_companies: memberships.length,
        }
      },

      /**
       * Get user membership summary
       */
      async getUserMembershipSummary(this: any, targetUserId: string): Promise<CompanyMembershipSummary> {
        const memberships = await this.findMany({
          where: {
            user_id: targetUserId,
          },
          include: {
            company: true,
            role: true,
          },
        })

        const summary: CompanyMembershipSummary = {
          total_companies: memberships.length,
          admin_companies: 0,
          member_companies: 0,
          companies: [],
        }

        for (const membership of memberships) {
          if (membership.role.role_name === 'swarm_company_admin') {
            summary.admin_companies++
          } else {
            summary.member_companies++
          }
          summary.companies.push({
            company_id: membership.company.company_id,
            name: membership.company.name,
            role: membership.role.role_name,
          })
        }

        return summary
      },

      /**
       * Get company admins
       */
      async getCompanyAdmins(this: any, companyId: string) {
        const admins = await this.findMany({
          where: {
            company_id: companyId,
            role: {
              role_name: 'swarm_company_admin',
            },
          },
          include: {
            user: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
        })

        return admins
      },

      /**
       * Get company members (non-admins)
       */
      async getCompanyMembers(this: any, companyId: string) {
        const members = await this.findMany({
          where: {
            company_id: companyId,
            role: {
              role_name: {
                not: 'swarm_company_admin',
              },
            },
          },
          include: {
            user: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
        })

        return members
      },

      /**
       * Check if user is member of company
       */
      async isUserMemberOfCompany(this: any, targetUserId: string, companyId: string): Promise<{
        is_member: boolean
        membership?: any
        role?: any
      }> {
        const membership = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: targetUserId,
              company_id: companyId,
            },
          },
          include: {
            role: true,
          },
        })

        return {
          is_member: !!membership,
          membership,
          role: membership?.role,
        }
      },

      /**
       * Get user's role in specific company
       */
      async getUserRoleInCompany(this: any, targetUserId: string, companyId: string) {
        const membership = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: targetUserId,
              company_id: companyId,
            },
          },
          include: {
            role: true,
          },
        })

        return membership?.role?.role_name || null
      },

      /**
       * Search users within company
       */
      async searchCompanyUsers(this: any, companyId: string, searchQuery: string, limit: number = 20) {
        const users = await this.findMany({
          where: {
            company_id: companyId,
            user: {
              OR: [
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { name: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          },
          include: {
            user: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
            role: true,
          },
          orderBy: {
            user: {
              name: 'asc',
            },
          },
          take: limit,
        })

        return users
      },

      /**
       * Get company statistics
       */
      async getCompanyUserStatistics(this: any, companyId: string) {
        const stats = await this.aggregate({
          where: {
            company_id: companyId,
          },
          _count: true,
          _avg: {
            user_id: true,
          },
          _sum: {
            user_id: true,
          },
          by: ['role_id'],
        })

        const totalUsers = stats.reduce((sum: number, stat: any) => sum + stat._count, 0)
        const adminCount = stats.find((stat: any) => stat.role_id === 'swarm_company_admin')?._count || 0
        const memberCount = totalUsers - adminCount

        return {
          total_users: totalUsers,
          admin_count: adminCount,
          member_count: memberCount,
          by_role: stats.map((stat: any) => ({
            role_id: stat.role_id,
            count: stat._count,
          })),
        }
      },

      buildUserOrderBy(sortBy?: string, sortOrder?: string): any {
        const order: any = {}
        switch (sortBy) {
          case 'name':
            order.user = { name: sortOrder || 'asc' }
            break
          case 'role':
            order.role = { role_name: sortOrder || 'asc' }
            break
          case 'joined_date':
            order.created_at = sortOrder || 'asc'
            break
          default:
            order.user = { name: 'asc' }
        }
        return order
      },
    },
  },
})