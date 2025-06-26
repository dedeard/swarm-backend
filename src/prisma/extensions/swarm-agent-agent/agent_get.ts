/**
 * Prisma Extension for Agent Retrieval
 * Simple agent retrieval without admin context
 */

import { Prisma } from '@prisma/client'

// Agent filters type
interface AgentFilters {
  agent_id?: string
  agent_name?: string
  company_id?: string
  user_id?: string
  is_public?: boolean
  on_status?: boolean
  [key: string]: any
}

/**
 * Get Agent Extension
 * Extends Prisma with agent retrieval capabilities
 */
export const getAgentExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      agent: {
        /**
         * Get agents - simplified version without admin context
         */
        async getAgents(this: any, filters: AgentFilters = {}) {
          // Get agents with filters directly
          const agents = await this.findMany({
            where: filters,
            orderBy: {
              created_at: 'desc',
            },
          })
          
          return agents
        },

        /**
         * Get a single agent by ID - simplified version without admin context
         */
        async getAgentById(this: any, agentId: string) {
          console.log(`Retrieving agent with ID: ${agentId}`)
          
          // Get agent by ID directly
          const agent = await this.findUnique({
            where: {
              agent_id: agentId,
            },
          })
          
          return agent
        }
      }
    }
  })
})
