import { Prisma } from '@prisma/client'

// Type definitions for agent update operations
export interface UpdateAgentInput {
  agent_name?: string
  description?: string
  route_path?: string
  agent_style?: string
  on_status?: boolean
  is_public?: boolean
  avatar_url?: string
  category_id?: string
  template_id?: string
  workflow_id?: string
  use_memory?: boolean
  media_input?: any
  media_output?: any
  use_tool?: boolean
  model_default?: string
}

// Simplified Agent Update Extension
export const agentUpdateExtension = Prisma.defineExtension({
  name: 'AgentUpdateExtension',
  model: {
    agent: {
      /**
       * Update an agent
       * @param agentId - ID of the agent to update
       * @param data - Update data for the agent
       * @param userId - ID of the user performing the update
       */
      async updateAgent(this: any, agentId: string, data: UpdateAgentInput, userId: string) {
        console.log(`Updating agent: ${agentId}`)
        
        // Check if agent exists
        const existingAgent = await this.findUnique({
          where: { agent_id: agentId },
          select: {
            agent_id: true,
            agent_name: true,
            user_id: true,
            company_id: true,
          },
        })

        if (!existingAgent) {
          throw new Error('Agent not found')
        }

        // Update the agent directly
        const updatedAgent = await this.update({
          where: { agent_id: agentId },
          data: data
        })

        return updatedAgent
      },

      /**
       * Bulk update multiple agents
       * @param agentIds - Array of agent IDs to update
       * @param data - Update data to apply to all agents
       * @param userId - ID of the user performing the update
       */
      async bulkUpdateAgents(this: any, agentIds: string[], data: UpdateAgentInput, userId: string) {
        console.log(`Bulk updating ${agentIds.length} agents`)
        
        // Perform bulk update directly
        const result = await this.updateMany({
          where: { agent_id: { in: agentIds } },
          data: data
        })

        return {
          updated_count: result.count,
          agent_ids: agentIds,
        }
      },
    },
  },
})

export type AgentUpdateExtension = typeof agentUpdateExtension
