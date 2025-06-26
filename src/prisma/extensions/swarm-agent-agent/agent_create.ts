/**
 * Prisma Extension for Agent Creation
 * Simple agent creation without admin context
 */

import { Prisma } from '@prisma/client';

// Agent input data type
export interface AgentCreateInput {
  agent_name: string;
  description?: string;
  company_id?: string;
  on_status?: boolean;
  is_public?: boolean;
  use_memory?: boolean;
  use_tool?: boolean;
  agent_style?: string;
  model_default?: string;
  [key: string]: any;
}

/**
 * Create Agent Extension
 * Extends Prisma with agent creation capabilities
 */
export const createAgentExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      agent: {
        /**
         * Create an agent - simplified version without admin context
         */
        async createAgent(this: any, data: AgentCreateInput, userId: string) {
          // Prepare agent data
          const agentData = {
            ...data,
            user_id: userId,
          };

          console.log(`Creating agent: ${agentData.agent_name}`);

          // Create the agent directly without admin context
          const createdAgent = await this.create({
            data: agentData,
          });

          return createdAgent;
        },
      },
    },
  });
});
