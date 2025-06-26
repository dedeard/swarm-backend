import { Prisma } from '@prisma/client';
import { DatabaseHelper } from '../../shared/database-helper';
import { ExtensionContext } from '../../shared/extension-context';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for agent log operations with enhanced security
export interface CreateAgentLogInput {
  agent_id: string;
  log_type: 'info' | 'warning' | 'error' | 'debug' | 'conversation';
  message: string;
  metadata?: any;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  response_time_ms?: number;
  tokens_used?: number;
  cost?: number;
}

export interface BulkCreateLogInput {
  logs: CreateAgentLogInput[];
  batch_id?: string;
}

// Enhanced Agent Log Extensions with Ultra-Simple RLS + Extension Architecture
export const agentLogAddExtension = Prisma.defineExtension({
  name: 'AgentLogAddExtension',
  model: {
    agentLog: {
      // Add a single log entry with enhanced security
      async addAgentLog(
        this: any,
        input: CreateAgentLogInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client BEFORE permission validation
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for log creation
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent_log',
          data: {
            log_creation: true,
            agent_id: input.agent_id,
            log_type: input.log_type,
          },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get the base Prisma client for raw queries
            const basePrisma = ExtensionContext.getBasePrismaClient();
            if (!basePrisma) {
              throw new SecurityError(
                'Database client not available for raw queries',
                {
                  userId,
                  userRole,
                  operation: 'addAgentLog',
                },
              );
            }

            // Verify agent exists and user has access using DatabaseHelper
            console.log(`[AgentLogAdd] Checking for agent ${input.agent_id}`);
            const agent = await DatabaseHelper.getAgentCompany(input.agent_id);
            console.log(`[AgentLogAdd] Agent lookup result:`, agent);

            if (!agent) {
              // Try a direct query to see if the agent exists in any schema
              const basePrisma = ExtensionContext.getBasePrismaClient();
              if (basePrisma) {
                try {
                  const directCheck = await basePrisma.$executeRaw`
                    SELECT agent_id, user_id, company_id FROM "swarm-agent".agents
                    WHERE agent_id = ${input.agent_id}::UUID
                  `;
                  console.log(
                    `[AgentLogAdd] Direct agent check result:`,
                    directCheck,
                  );
                } catch (error) {
                  console.log(`[AgentLogAdd] Direct agent check error:`, error);
                }
              }

              throw new SecurityError(
                `Agent with ID ${input.agent_id} does not exist. Please create the agent first or use a valid agent ID.`,
                {
                  userId,
                  userRole,
                  agentId: input.agent_id,
                  errorType: 'AGENT_NOT_FOUND',
                },
              );
            }

            // Check if user has access to this agent
            const canAccess = await DatabaseHelper.canAccessAgent(
              userId,
              input.agent_id,
              userRole,
            );
            if (!canAccess) {
              throw new SecurityError(
                `Access denied: You do not have permission to create logs for agent ${input.agent_id}. You can only create logs for agents you own, agents in companies you belong to, or public agents.`,
                {
                  userId,
                  userRole,
                  agentId: input.agent_id,
                  agentOwner: agent.user_id,
                  agentCompany: agent.company_id,
                  errorType: 'ACCESS_DENIED',
                },
              );
            }

            // Create the log entry using the agentLog model
            const logEntry = await this.create({
              data: {
                agent_id: input.agent_id,
                user_id: input.user_id || userId,
                company_id: agent.company_id,
                // Map available input fields to database schema
                input_token: input.tokens_used || null,
                output_token: null, // Not provided in current input
                embedding_token: null, // Not provided in current input
                pricing: input.cost ? parseFloat(input.cost.toString()) : null,
                chat_history: input.metadata || null,
                created_at: new Date(),
              },
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                    company_id: true,
                  },
                },
              },
            });

            // Convert BigInt to string for JSON serialization
            return {
              ...logEntry,
              agent_log_id: logEntry.agent_log_id.toString(),
            };
          },
          {
            userId,
            userRole,
            operation: 'addAgentLog',
            resource: 'agent',
            resourceId: input.agent_id,
            metadata: {
              logType: input.log_type,
              message: input.message.substring(0, 100), // Truncate for audit
            },
          },
        );
      },

      // Bulk add log entries
      async bulkAddAgentLogs(
        this: any,
        input: BulkCreateLogInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for bulk log creation
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent_log',
          data: { bulk_log_creation: true, log_count: input.logs.length },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get the base Prisma client for raw queries
            const basePrisma = ExtensionContext.getBasePrismaClient();
            if (!basePrisma) {
              throw new SecurityError(
                'Database client not available for raw queries',
                {
                  userId,
                  userRole,
                  operation: 'bulkAddAgentLogs',
                },
              );
            }

            const createdLogs = [];
            const errors = [];

            for (const logInput of input.logs) {
              try {
                // Verify agent exists and user has access using DatabaseHelper
                const agent = await DatabaseHelper.getAgentCompany(
                  logInput.agent_id,
                );
                if (!agent) {
                  throw new SecurityError(
                    `Agent with ID ${logInput.agent_id} does not exist`,
                    {
                      userId,
                      userRole,
                      agentId: logInput.agent_id,
                      errorType: 'AGENT_NOT_FOUND',
                    },
                  );
                }

                const canAccess = await DatabaseHelper.canAccessAgent(
                  userId,
                  logInput.agent_id,
                  userRole,
                );
                if (!canAccess) {
                  throw new SecurityError(
                    `Access denied for agent ${logInput.agent_id}`,
                    {
                      userId,
                      userRole,
                      agentId: logInput.agent_id,
                      errorType: 'ACCESS_DENIED',
                    },
                  );
                }

                // Create the log entry
                const logEntry = await this.create({
                  data: {
                    ...logInput,
                    user_id: logInput.user_id || userId,
                    created_at: new Date(),
                  },
                });

                createdLogs.push(logEntry);
              } catch (error) {
                errors.push({
                  agent_id: logInput.agent_id,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }

            return {
              created_logs: createdLogs,
              errors: errors,
              success_count: createdLogs.length,
              error_count: errors.length,
              batch_id: input.batch_id,
            };
          },
          {
            userId,
            userRole,
            operation: 'bulkAddAgentLogs',
            resource: 'agent',
            metadata: {
              logCount: input.logs.length,
              batchId: input.batch_id,
            },
          },
        );
      },

      // Add conversation log with enhanced metadata
      async addConversationLog(
        this: any,
        agentId: string,
        userMessage: string,
        agentResponse: string,
        metadata: any,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent_log',
          data: { conversation_log: true, agent_id: agentId },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Create conversation log entry
            const conversationLog = await this.create({
              data: {
                agent_id: agentId,
                log_type: 'conversation',
                message: `User: ${userMessage}\nAgent: ${agentResponse}`,
                metadata: {
                  ...metadata,
                  user_message: userMessage,
                  agent_response: agentResponse,
                  conversation_timestamp: new Date().toISOString(),
                },
                user_id: userId,
                created_at: new Date(),
              },
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                  },
                },
              },
            });

            return conversationLog;
          },
          {
            userId,
            userRole,
            operation: 'addConversationLog',
            resource: 'agent',
            resourceId: agentId,
            metadata: {
              conversationType: 'user_agent_interaction',
              messageLength: userMessage.length + agentResponse.length,
            },
          },
        );
      },

      // Add error log with stack trace
      async addErrorLog(
        this: any,
        agentId: string,
        error: Error,
        context: any,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent_log',
          data: { error_log: true, agent_id: agentId },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Create error log entry
            const errorLog = await this.create({
              data: {
                agent_id: agentId,
                log_type: 'error',
                message: error.message,
                metadata: {
                  error_name: error.name,
                  stack_trace: error.stack,
                  context: context,
                  timestamp: new Date().toISOString(),
                },
                user_id: userId,
                created_at: new Date(),
              },
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                  },
                },
              },
            });

            return errorLog;
          },
          {
            userId,
            userRole,
            operation: 'addErrorLog',
            resource: 'agent',
            resourceId: agentId,
            metadata: {
              errorType: error.name,
              errorMessage: error.message,
            },
          },
        );
      },
    },
  },
});

export type AgentLogAddExtension = typeof agentLogAddExtension;
