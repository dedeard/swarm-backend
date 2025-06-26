import { Prisma } from '@prisma/client';
import { DatabaseHelper } from '../../shared/database-helper';
import { ExtensionContext } from '../../shared/extension-context';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Enhanced Agent Log Statistics Extensions with Ultra-Simple RLS + Extension Architecture
export const agentLogStatsExtension = Prisma.defineExtension({
  name: 'AgentLogStatsExtension',
  model: {
    agentLog: {
      // Get log statistics for an agent
      async getAgentLogStats(
        this: any,
        params: any,
        userId: string,
        userRole: string,
      ) {
        // Extract parameters properly
        const agentId = params.agent_id || params.agentId;
        const limit = params.limit || 10;
        const offset = params.offset || 0;
        const timeRange = params.timeRange;
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'agent',
          resourceId: agentId,
          data: { log_statistics: true },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {};

            // Only add agent_id filter if provided
            if (agentId) {
              where.agent_id = agentId;
            }

            if (timeRange) {
              where.created_at = {
                gte: timeRange.start,
                lte: timeRange.end,
              };
            }

            // Apply role-based filtering
            const secureWhere = await this.buildSecureFilters(
              where,
              userRole,
              userId,
            );

            // Get total count
            const totalCount = await this.count({ where: secureWhere });

            // Get counts by agent (since log_type doesn't exist in schema)
            const agentCounts = await this.groupBy({
              by: ['agent_id'],
              where: secureWhere,
              _count: { agent_id: true },
            });

            // Get recent activity (last 24 hours)
            const recentWhere = {
              ...secureWhere,
              created_at: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            };
            const recentCount = await this.count({ where: recentWhere });

            return {
              agent_id: agentId,
              total_logs: totalCount,
              recent_logs_24h: recentCount,
              agent_breakdown: agentCounts.reduce(
                (acc: Record<string, number>, item: any) => {
                  acc[item.agent_id || 'unknown'] = item._count.agent_id;
                  return acc;
                },
                {} as Record<string, number>,
              ),
              time_range: timeRange,
            };
          },
          {
            userId,
            userRole,
            operation: 'getAgentLogStats',
            resource: 'agent',
            resourceId: agentId,
            metadata: { timeRange },
          },
        );
      },

      // Helper method to build secure filters
      async buildSecureFilters(
        baseWhere: any,
        userRole: string,
        userId: string,
      ): Promise<any> {
        const where = { ...baseWhere };

        switch (userRole) {
          case 'swarm_user':
            where.agent = { user_id: userId };
            break;
          case 'swarm_company_admin':
            const adminCompanies =
              await DatabaseHelper.getUserAdminCompanies(userId);
            where.agent = {
              OR: [{ company_id: { in: adminCompanies } }, { user_id: userId }],
            };
            break;
          case 'swarm_admin':
            const hasPermission = await DatabaseHelper.hasPermission(
              userId,
              'agent:read',
            );
            if (!hasPermission) {
              throw new SecurityError('Missing agent:read permission', {
                userId,
              });
            }
            break;
          case 'swarm_public':
            where.agent = { is_public: true };
            break;
            where.log_id = 'never-match';
            break;
            break;
          default:
            where.log_id = 'never-match';
            break;
        }

        return where;
      },
    },
  },
});

export type AgentLogStatsExtension = typeof agentLogStatsExtension;
