import { Prisma } from '@prisma/client';
import { DatabaseHelper } from '../../shared/database-helper';
import { ExtensionContext } from '../../shared/extension-context';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for agent log deletion operations with enhanced security
export interface DeleteLogOptions {
  older_than?: Date;
  log_types?: string[];
  agent_ids?: string[];
  dry_run?: boolean;
}

// Enhanced Agent Log Deletion Extensions with Ultra-Simple RLS + Extension Architecture
export const agentLogDeleteExtension = Prisma.defineExtension({
  name: 'AgentLogDeleteExtension',
  model: {
    agentLog: {
      // Delete a single log entry
      async deleteAgentLog(
        this: any,
        logId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for log deletion
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'delete',
          resource: 'agent',
          resourceId: logId,
          data: { log_deletion: true },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Check if log exists and user has access
            const existingLog = await this.findUnique({
              where: { log_id: logId },
              include: {
                agent: {
                  select: {
                    agent_id: true,
                    agent_name: true,
                    user_id: true,
                    company_id: true,
                  },
                },
              },
            });

            if (!existingLog) {
              throw new SecurityError('Log entry not found or access denied', {
                userId,
                userRole,
                logId,
              });
            }

            // Delete the log entry
            const deletedLog = await this.delete({
              where: { log_id: logId },
            });

            return deletedLog;
          },
          {
            userId,
            userRole,
            operation: 'deleteAgentLog',
            resource: 'agent',
            resourceId: logId,
            metadata: { logDeletion: true },
          },
        );
      },

      // Bulk delete logs with filters
      async bulkDeleteAgentLogs(
        this: any,
        options: DeleteLogOptions,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for bulk log deletion
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'delete',
          resource: 'agent',
          data: { bulk_log_deletion: true, options },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Build where clause from options
            const where: any = {};

            if (options.older_than) {
              where.created_at = {
                lt: options.older_than,
              };
            }

            if (options.log_types && options.log_types.length > 0) {
              where.log_type = {
                in: options.log_types,
              };
            }

            if (options.agent_ids && options.agent_ids.length > 0) {
              where.agent_id = {
                in: options.agent_ids,
              };
            }

            // Apply role-based filtering
            const secureWhere = await this.buildSecureFilters(
              where,
              userRole,
              userId,
            );

            // Get logs that would be deleted (for audit and dry run)
            const logsToDelete = await this.findMany({
              where: secureWhere,
              select: {
                log_id: true,
                agent_id: true,
                log_type: true,
                created_at: true,
              },
            });

            if (logsToDelete.length === 0) {
              return {
                deleted_count: 0,
                deleted_logs: [],
                dry_run: options.dry_run || false,
              };
            }

            // If dry run, return what would be deleted
            if (options.dry_run) {
              return {
                deleted_count: logsToDelete.length,
                deleted_logs: logsToDelete,
                dry_run: true,
              };
            }

            // Perform bulk deletion
            const result = await this.deleteMany({
              where: secureWhere,
            });

            return {
              deleted_count: result.count,
              deleted_logs: logsToDelete,
              dry_run: false,
            };
          },
          {
            userId,
            userRole,
            operation: 'bulkDeleteAgentLogs',
            resource: 'agent',
            metadata: {
              options,
              dryRun: options.dry_run,
            },
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
            // Can only delete logs for own agents
            where.agent = {
              user_id: userId,
            };
            break;

          case 'swarm_company_admin':
            // Can delete logs for agents in managed companies or own agents
            const adminCompanies =
              await DatabaseHelper.getUserAdminCompanies(userId);
            where.agent = {
              OR: [{ company_id: { in: adminCompanies } }, { user_id: userId }],
            };
            break;

          case 'swarm_admin':
            // Check function permission
            const hasDeletePermission = await DatabaseHelper.hasPermission(
              userId,
              'agent:delete',
            );
            if (!hasDeletePermission) {
              throw new SecurityError('Missing agent:delete permission', {
                userId,
                requiredPermission: 'agent:delete',
              });
            }
            // Can delete all logs if has permission
            break;

          case 'swarm_public':
            // No delete access
            where.log_id = 'never-match';
            break;

            // Can delete all logs
            break;

          default:
            // Unknown role - no access
            where.log_id = 'never-match';
            break;
        }

        return where;
      },
    },
  },
});

export type AgentLogDeleteExtension = typeof agentLogDeleteExtension;
