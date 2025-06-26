import { Prisma } from '@prisma/client';
import { DatabaseHelper } from '../../shared/database-helper';
import { ExtensionContext } from '../../shared/extension-context';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for agent log retrieval operations with enhanced security
export interface LogFilters {
  agent_id?: string;
  log_types?: string[];
  start_date?: Date;
  end_date?: Date;
  user_id?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

// Enhanced Agent Log Retrieval Extensions with Ultra-Simple RLS + Extension Architecture
export const agentLogGetExtension = Prisma.defineExtension({
  name: 'AgentLogGetExtension',
  model: {
    agentLog: {
      // Get logs with enhanced security and filtering
      async getAgentLogs(
        this: any,
        filters: LogFilters,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for log reading
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'agent',
          data: { log_reading: true, filters },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Build where clause from filters
            const where: any = {};

            if (filters.agent_id) {
              where.agent_id = filters.agent_id;
            }

            // Note: log_type field doesn't exist in AgentLog schema
            // Skipping log_types filter as it's not supported by the current schema

            if (filters.start_date || filters.end_date) {
              where.created_at = {};
              if (filters.start_date) {
                where.created_at.gte = filters.start_date;
              }
              if (filters.end_date) {
                where.created_at.lte = filters.end_date;
              }
            }

            if (filters.user_id) {
              where.user_id = filters.user_id;
            }

            // Note: session_id field doesn't exist in AgentLog schema
            // Skipping session_id filter as it's not supported by the current schema

            // Apply role-based filtering
            const secureWhere = await this.buildSecureFilters(
              where,
              userRole,
              userId,
            );

            const logs = await this.findMany({
              where: secureWhere,
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                    company_id: true,
                  },
                },
              },
              orderBy: {
                created_at: 'desc',
              },
              take: filters.limit || 100,
              skip: filters.offset || 0,
            });

            // Convert BigInt fields to strings for JSON serialization
            return logs.map((log: any) => ({
              ...log,
              agent_log_id: log.agent_log_id.toString(),
            }));
          },
          {
            userId,
            userRole,
            operation: 'getAgentLogs',
            resource: 'agent',
            metadata: {
              filters,
              resultCount: 0, // Will be updated after operation
            },
          },
        );
      },

      // Get a single log entry
      async getAgentLog(
        this: any,
        logId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'agent',
          resourceId: logId,
          data: { single_log_reading: true },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const log = await this.findUnique({
              where: { agent_log_id: logId },
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                    company_id: true,
                    user_id: true,
                  },
                },
              },
            });

            if (!log) {
              throw new SecurityError('Log entry not found or access denied', {
                userId,
                userRole,
                logId,
              });
            }

            // Additional access validation based on role
            const hasAccess = await this.validateLogAccess(
              log,
              userId,
              userRole,
            );
            if (!hasAccess) {
              throw new SecurityError('Access denied to this log entry', {
                userId,
                userRole,
                logId,
              });
            }

            return log;
          },
          {
            userId,
            userRole,
            operation: 'getAgentLog',
            resource: 'agent',
            resourceId: logId,
          },
        );
      },

      // Helper method to build secure filters based on user role
      async buildSecureFilters(
        baseWhere: any,
        userRole: string,
        userId: string,
      ): Promise<any> {
        const where = { ...baseWhere };

        switch (userRole) {
          case 'swarm_user':
            // Can only see logs for own agents
            where.agent = {
              user_id: userId,
            };
            break;

          case 'swarm_company_admin':
            // Can see logs for agents in managed companies or own agents
            const adminCompanies =
              await DatabaseHelper.getUserAdminCompanies(userId);
            where.agent = {
              OR: [{ company_id: { in: adminCompanies } }, { user_id: userId }],
            };
            break;

          case 'swarm_admin':
            // Check function permission
            const hasReadPermission = await DatabaseHelper.hasPermission(
              userId,
              'agent:read',
            );
            if (!hasReadPermission) {
              throw new SecurityError('Missing agent:read permission', {
                userId,
                requiredPermission: 'agent:read',
              });
            }
            // Can see all logs if has permission
            break;

          case 'swarm_public':
            // Only logs for public agents
            where.agent = {
              is_public: true,
            };
            break;

            // No access to log data
            where.agent_log_id = 'never-match';
            break;

            // Can see all logs
            break;

          default:
            // Unknown role - no access
            where.agent_log_id = 'never-match';
            break;
        }

        return where;
      },

      // Helper method to validate log access
      async validateLogAccess(
        log: any,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        switch (userRole) {
          case 'swarm_user':
            return log.agent?.user_id === userId;

          case 'swarm_company_admin':
            if (log.agent?.user_id === userId) return true;
            if (log.agent?.company_id) {
              return await DatabaseHelper.isCompanyAdmin(
                userId,
                log.agent.company_id,
              );
            }
            return false;

          case 'swarm_admin':
            return await DatabaseHelper.hasPermission(userId, 'agent:read');

          case 'swarm_public':
            return log.agent?.is_public === true;

            return false;

            return true;

          default:
            return false;
        }
      },
    },
  },
});

export type AgentLogGetExtension = typeof agentLogGetExtension;
