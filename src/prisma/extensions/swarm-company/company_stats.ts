import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for company statistics operations
export interface CompanyStatistics {
  company_id: string;
  total_users: number;
  total_agents: number;
  total_tools: number;
  total_workflows: number;
  active_users_last_30_days?: number;
  growth_metrics?: {
    users_growth: number;
    agents_growth: number;
    tools_growth: number;
  };
  role_distribution: Array<{
    role_name: string;
    count: number;
  }>;
  industry_comparison?: {
    industry: string;
    rank_in_industry: number;
    total_in_industry: number;
  };
}

export interface AggregatedStatistics {
  total_companies: number;
  total_users_across_companies: number;
  total_agents_across_companies: number;
  total_tools_across_companies: number;
  average_users_per_company: number;
  top_industries: Array<{
    industry: string;
    company_count: number;
    user_count: number;
  }>;
  company_size_distribution: Array<{
    size: string;
    count: number;
  }>;
}

export interface CompanyActivityMetrics {
  company_id: string;
  daily_active_users: Array<{
    date: string;
    count: number;
  }>;
  agent_usage_stats: Array<{
    agent_id: string;
    agent_name: string;
    usage_count: number;
  }>;
  tool_usage_stats: Array<{
    tool_id: string;
    tool_name: string;
    usage_count: number;
  }>;
}

// Enhanced Company Statistics Extensions with Ultra-Simple RLS + Extension Architecture
export const companyStatsExtension = Prisma.defineExtension({
  name: 'CompanyStatsExtension',
  model: {
    company: {
      /**
       * Get comprehensive statistics for a company
       */
      async getCompanyStatistics(
        this: any,
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<CompanyStatistics> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'company',
          resourceId: companyId,
        });

        // 2. Validate access to company
        const hasAccess = await this.validateStatsAccess(
          companyId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError('Access denied to view company statistics', {
            userId,
            userRole,
            companyId,
          });
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get basic counts
            const [userCount, agentCount, toolCount, workflowCount] =
              await Promise.all([
                this.getUserCount(companyId),
                this.getAgentCount(companyId),
                this.getToolCount(companyId),
                this.getWorkflowCount(companyId),
              ]);

            // Get role distribution
            const roleDistribution = await this.getRoleDistribution(companyId);

            // Get growth metrics (comparing last 30 days to previous 30 days)
            const growthMetrics = await this.getGrowthMetrics(companyId);

            // Get industry comparison
            const company = await this.findUnique({
              where: { company_id: companyId },
              select: { industry: true },
            });

            let industryComparison;
            if (company?.industry) {
              industryComparison = await this.getIndustryComparison(
                companyId,
                company.industry,
              );
            }

            return {
              company_id: companyId,
              total_users: userCount,
              total_agents: agentCount,
              total_tools: toolCount,
              total_workflows: workflowCount,
              role_distribution: roleDistribution,
              growth_metrics: growthMetrics,
              industry_comparison: industryComparison,
            };
          },
          {
            userId,
            userRole,
            operation: 'getCompanyStatistics',
            resource: 'company',
            resourceId: companyId,
          },
        );
      },

      /**
       * Get aggregated statistics across all companies (admin only)
       */
      async getAggregatedStatistics(
        this: any,
        userId: string,
        userRole: string,
      ): Promise<AggregatedStatistics> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate admin permissions
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Aggregated statistics require admin privileges',
            {
              userId,
              userRole,
            },
          );
        }

        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'company',
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get total companies
            const totalCompanies = await this.count();

            // Get aggregated counts
            const [totalUsers, totalAgents, totalTools] = await Promise.all([
              this.getTotalUsersAcrossCompanies(),
              this.getTotalAgentsAcrossCompanies(),
              this.getTotalToolsAcrossCompanies(),
            ]);

            // Get top industries
            const topIndustries = await this.getTopIndustries();

            // Get company size distribution
            const sizeDistribution = await this.getCompanySizeDistribution();

            return {
              total_companies: totalCompanies,
              total_users_across_companies: totalUsers,
              total_agents_across_companies: totalAgents,
              total_tools_across_companies: totalTools,
              average_users_per_company:
                totalCompanies > 0
                  ? Math.round(totalUsers / totalCompanies)
                  : 0,
              top_industries: topIndustries,
              company_size_distribution: sizeDistribution,
            };
          },
          {
            userId,
            userRole,
            operation: 'getAggregatedStatistics',
            resource: 'company',
          },
        );
      },

      /**
       * Get company activity metrics
       */
      async getCompanyActivityMetrics(
        this: any,
        companyId: string,
        days: number = 30,
        userId: string,
        userRole: string,
      ): Promise<CompanyActivityMetrics> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate access
        const hasAccess = await this.validateStatsAccess(
          companyId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to view company activity metrics',
            {
              userId,
              userRole,
              companyId,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            // Get daily active users (placeholder - would need activity tracking)
            const dailyActiveUsers = await this.getDailyActiveUsers(
              companyId,
              days,
            );

            // Get agent usage stats (placeholder - would need usage tracking)
            const agentUsageStats = await this.getAgentUsageStats(
              companyId,
              days,
            );

            // Get tool usage stats (placeholder - would need usage tracking)
            const toolUsageStats = await this.getToolUsageStats(
              companyId,
              days,
            );

            return {
              company_id: companyId,
              daily_active_users: dailyActiveUsers,
              agent_usage_stats: agentUsageStats,
              tool_usage_stats: toolUsageStats,
            };
          },
          {
            userId,
            userRole,
            operation: 'getCompanyActivityMetrics',
            resource: 'company',
            resourceId: companyId,
            metadata: { days },
          },
        );
      },

      /**
       * Compare company with industry peers
       */
      async compareWithIndustryPeers(
        this: any,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        const hasAccess = await this.validateStatsAccess(
          companyId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError('Access denied to view industry comparison', {
            userId,
            userRole,
            companyId,
          });
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const company = await this.findUnique({
              where: { company_id: companyId },
              include: {
                _count: {
                  select: {
                    user_companies: true,
                    agents: true,
                    tools: true,
                  },
                },
              },
            });

            if (!company) {
              throw new SecurityError('Company not found', {
                userId,
                companyId,
              });
            }

            // Get industry averages
            const industryAverages = await this.getIndustryAverages(
              company.industry,
            );

            // Calculate percentiles
            const userPercentile = await this.getUserCountPercentile(
              companyId,
              company.industry,
            );
            const agentPercentile = await this.getAgentCountPercentile(
              companyId,
              company.industry,
            );

            return {
              company: {
                users: company._count.user_companies,
                agents: company._count.agents,
                tools: company._count.tools,
              },
              industry_averages: industryAverages,
              percentiles: {
                users: userPercentile,
                agents: agentPercentile,
              },
              industry: company.industry,
            };
          },
          {
            userId,
            userRole,
            operation: 'compareWithIndustryPeers',
            resource: 'company',
            resourceId: companyId,
          },
        );
      },

      // Helper methods
      async validateStatsAccess(
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        switch (userRole) {
          case 'swarm_admin':
            return await DatabaseHelper.hasPermission(userId, 'company:read');
          case 'swarm_company_admin':
            return await DatabaseHelper.isCompanyAdmin(userId, companyId);
          case 'swarm_user':
            return false; // Users cannot access company stats
          default:
            return false;
        }
      },
    },
  },
});

export type CompanyStatsExtension = typeof companyStatsExtension;
