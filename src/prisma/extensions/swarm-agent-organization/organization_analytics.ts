import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for organization analytics operations
export interface OrganizationStatistics {
  total_organizations: number;
  public_organizations: number;
  private_organizations: number;
  organizations_by_company: Array<{
    company_id: string;
    company_name: string;
    count: number;
  }>;
  recent_organizations: Array<{
    date: string;
    count: number;
  }>;
  public_organization_rate: number;
  organizations_with_templates: number;
  organizations_with_workflows: number;
}

export interface OrganizationActivityMetrics {
  organization_id: string;
  organization_name: string;
  user_id: string;
  company_id?: string;
  is_public: boolean;
  has_template: boolean;
  has_workflow: boolean;
  created_at: Date;
  updated_at: Date;
  metadata_complexity: number;
}

export interface OrganizationFilters {
  user_id?: string;
  company_id?: string;
  is_public?: boolean;
  has_template?: boolean;
  has_workflow?: boolean;
  created_after?: Date;
  created_before?: Date;
}

// Enhanced Organization Analytics Extensions with Ultra-Simple RLS + Extension Architecture
export const organizationAnalyticsExtension = Prisma.defineExtension({
  name: 'OrganizationAnalyticsExtension',
  model: {
    organization: {
      /**
       * Get comprehensive organization statistics (admin only)
       */
      async getOrganizationStatistics(
        this: any,
        userId: string,
        userRole: string,
      ): Promise<OrganizationStatistics> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate admin permissions
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Organization statistics require admin privileges',
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
          resource: 'organization',
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get basic counts
            const [
              totalOrganizations,
              publicOrganizations,
              organizationsWithTemplates,
              organizationsWithWorkflows,
            ] = await Promise.all([
              this.count(),
              this.count({ where: { is_public: true } }),
              this.count({ where: { template_id: { not: null } } }),
              this.count({ where: { workflow_id: { not: null } } }),
            ]);

            const privateOrganizations =
              totalOrganizations - publicOrganizations;

            // Get organizations by company
            const organizationsByCompany =
              await this.getOrganizationsByCompany();

            // Get recent organizations (last 30 days)
            const recentOrganizations = await this.getRecentOrganizations(30);

            // Calculate rates
            const publicOrganizationRate =
              totalOrganizations > 0
                ? (publicOrganizations / totalOrganizations) * 100
                : 0;

            return {
              total_organizations: totalOrganizations,
              public_organizations: publicOrganizations,
              private_organizations: privateOrganizations,
              organizations_by_company: organizationsByCompany,
              recent_organizations: recentOrganizations,
              public_organization_rate:
                Math.round(publicOrganizationRate * 100) / 100,
              organizations_with_templates: organizationsWithTemplates,
              organizations_with_workflows: organizationsWithWorkflows,
            };
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationStatistics',
            resource: 'organization',
          },
        );
      },

      /**
       * Get organization activity metrics
       */
      async getOrganizationActivityMetrics(
        this: any,
        organizationId: string,
        userId: string,
        userRole: string,
      ): Promise<OrganizationActivityMetrics> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate access
        const hasAccess = await DatabaseHelper.canAccessOrganization(
          userId,
          organizationId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to organization activity metrics',
            {
              userId,
              userRole,
              organizationId,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const organization = await this.findUnique({
              where: { organization_id: organizationId },
              include: {
                company: {
                  select: {
                    company_id: true,
                    name: true,
                  },
                },
              },
            });

            if (!organization) {
              throw new SecurityError('Organization not found', {
                userId,
                organizationId,
              });
            }

            // Calculate metadata complexity
            const metadataComplexity = organization.metadata
              ? Object.keys(organization.metadata).length
              : 0;

            return {
              organization_id: organization.organization_id,
              organization_name: organization.organization_name,
              user_id: organization.user_id,
              company_id: organization.company_id,
              is_public: organization.is_public || false,
              has_template: !!organization.template_id,
              has_workflow: !!organization.workflow_id,
              created_at: organization.created_at,
              updated_at: organization.updated_at,
              metadata_complexity: metadataComplexity,
            };
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationActivityMetrics',
            resource: 'organization',
            resourceId: organizationId,
          },
        );
      },

      /**
       * Get organization segments based on filters (admin only)
       */
      async getOrganizationSegments(
        this: any,
        filters: OrganizationFilters,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Only admins can access organization segments
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Organization segments require admin privileges',
            {
              userId,
              userRole,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {};

            if (filters.user_id) {
              where.user_id = filters.user_id;
            }
            if (filters.company_id) {
              where.company_id = filters.company_id;
            }
            if (filters.is_public !== undefined) {
              where.is_public = filters.is_public;
            }
            if (filters.has_template !== undefined) {
              if (filters.has_template) {
                where.template_id = { not: null };
              } else {
                where.template_id = null;
              }
            }
            if (filters.has_workflow !== undefined) {
              if (filters.has_workflow) {
                where.workflow_id = { not: null };
              } else {
                where.workflow_id = null;
              }
            }
            if (filters.created_after || filters.created_before) {
              where.created_at = {};
              if (filters.created_after) {
                where.created_at.gte = filters.created_after;
              }
              if (filters.created_before) {
                where.created_at.lte = filters.created_before;
              }
            }

            const organizations = await this.findMany({
              where,
              select: {
                organization_id: true,
                organization_name: true,
                user_id: true,
                company_id: true,
                is_public: true,
                template_id: true,
                workflow_id: true,
                created_at: true,
                company: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: {
                created_at: 'desc',
              },
            });

            return {
              segment_filters: filters,
              organization_count: organizations.length,
              organizations: organizations,
            };
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationSegments',
            resource: 'organization',
            metadata: { filters },
          },
        );
      },

      /**
       * Get organization usage analytics (admin only)
       */
      async getOrganizationUsageAnalytics(
        this: any,
        userId: string,
        userRole: string,
      ) {
        // Only admins can access usage analytics
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Organization usage analytics require admin privileges',
            {
              userId,
              userRole,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const totalOrganizations = await this.count();

            const usageStats = await DatabaseHelper.prismaClient.$executeRaw`
              SELECT 
                COUNT(CASE WHEN template_id IS NOT NULL THEN 1 END) as with_templates,
                COUNT(CASE WHEN workflow_id IS NOT NULL THEN 1 END) as with_workflows,
                COUNT(CASE WHEN template_id IS NOT NULL AND workflow_id IS NOT NULL THEN 1 END) as with_both,
                COUNT(CASE WHEN template_id IS NULL AND workflow_id IS NULL THEN 1 END) as with_neither,
                COUNT(CASE WHEN is_public = true THEN 1 END) as public_orgs,
                COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as company_associated
              FROM "swarm-organization".organizations
            `;

            const companyDistribution = await DatabaseHelper.prismaClient
              .$executeRaw`
              SELECT 
                c.name as company_name,
                COUNT(o.organization_id) as organization_count
              FROM "swarm-organization".organizations o
              LEFT JOIN "swarm-company".companies c ON o.company_id = c.company_id
              WHERE o.company_id IS NOT NULL
              GROUP BY c.company_id, c.name
              ORDER BY organization_count DESC
              LIMIT 10
            `;

            const userDistribution = await DatabaseHelper.prismaClient
              .$executeRaw`
              SELECT 
                user_id,
                COUNT(*) as organization_count
              FROM "swarm-organization".organizations
              GROUP BY user_id
              HAVING COUNT(*) > 1
              ORDER BY organization_count DESC
              LIMIT 10
            `;

            return {
              total_organizations: totalOrganizations,
              usage_statistics:
                Array.isArray(usageStats) && usageStats.length > 0
                  ? usageStats[0]
                  : {},
              company_distribution: Array.isArray(companyDistribution)
                ? companyDistribution
                : [],
              user_distribution: Array.isArray(userDistribution)
                ? userDistribution
                : [],
            };
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationUsageAnalytics',
            resource: 'organization',
          },
        );
      },

      /**
       * Get organization growth analytics (admin only)
       */
      async getOrganizationGrowthAnalytics(
        this: any,
        days: number = 30,
        userId: string,
        userRole: string,
      ) {
        // Only admins can access growth analytics
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Organization growth analytics require admin privileges',
            {
              userId,
              userRole,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const growthData = await DatabaseHelper.prismaClient.$executeRaw`
              SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_organizations,
                COUNT(CASE WHEN is_public = true THEN 1 END) as new_public_organizations,
                COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as new_company_organizations
              FROM "swarm-organization".organizations
              WHERE created_at >= NOW() - INTERVAL '${days} days'
              GROUP BY DATE(created_at)
              ORDER BY date DESC
            `;

            const totalBefore = await this.count({
              where: {
                created_at: {
                  lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
              },
            });

            const totalNow = await this.count();
            const growthCount = totalNow - totalBefore;
            const growthRate =
              totalBefore > 0 ? (growthCount / totalBefore) * 100 : 0;

            return {
              period_days: days,
              total_before: totalBefore,
              total_now: totalNow,
              growth_count: growthCount,
              growth_rate: Math.round(growthRate * 100) / 100,
              daily_growth: Array.isArray(growthData)
                ? growthData.map((row: any) => ({
                    date: row.date,
                    new_organizations: Number(row.new_organizations),
                    new_public_organizations: Number(
                      row.new_public_organizations,
                    ),
                    new_company_organizations: Number(
                      row.new_company_organizations,
                    ),
                  }))
                : [],
            };
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationGrowthAnalytics',
            resource: 'organization',
            metadata: { days },
          },
        );
      },

      // Helper methods
      async getOrganizationsByCompany(): Promise<
        Array<{ company_id: string; company_name: string; count: number }>
      > {
        const result = await DatabaseHelper.prismaClient.$executeRaw`
          SELECT 
            c.company_id,
            c.name as company_name,
            COUNT(o.organization_id) as count
          FROM "swarm-organization".organizations o
          INNER JOIN "swarm-company".companies c ON o.company_id = c.company_id
          GROUP BY c.company_id, c.name
          ORDER BY count DESC
          LIMIT 20
        `;
        return Array.isArray(result)
          ? result.map((row: any) => ({
              company_id: row.company_id,
              company_name: row.company_name,
              count: Number(row.count),
            }))
          : [];
      },

      async getRecentOrganizations(
        days: number,
      ): Promise<Array<{ date: string; count: number }>> {
        const result = await DatabaseHelper.prismaClient.$executeRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM "swarm-organization".organizations
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;
        return Array.isArray(result)
          ? result.map((row: any) => ({
              date: row.date,
              count: Number(row.count),
            }))
          : [];
      },
    },
  },
});

export type OrganizationAnalyticsExtension =
  typeof organizationAnalyticsExtension;
