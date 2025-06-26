import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Enhanced Organization Delete Extensions with Ultra-Simple RLS + Extension Architecture
export const deleteOrganizationExtension = Prisma.defineExtension({
  name: 'DeleteOrganizationExtension',
  model: {
    organization: {
      /**
       * Delete organization with full security validation
       */
      async deleteOrganization(
        this: any,
        organizationId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'delete',
          resource: 'organization',
          resourceId: organizationId,
        });

        // 2. Only admins can delete organizations
        if (userRole !== 'swarm_admin') {
          throw new SecurityError('Only admins can delete organizations', {
            userId,
            userRole,
            organizationId,
            operation: 'deleteOrganization',
          });
        }

        // 3. Validate function permission for admins
        if (userRole === 'swarm_admin') {
          const hasPermission = await DatabaseHelper.hasPermission(
            userId,
            'organization:delete',
          );
          if (!hasPermission) {
            throw new SecurityError('Missing organization:delete permission', {
              userId,
              requiredPermission: 'organization:delete',
            });
          }
        }

        // 4. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // First check if organization exists
            const existingOrganization = await this.findUnique({
              where: { organization_id: organizationId },
              select: {
                organization_id: true,
                organization_name: true,
                created_at: true,
              },
            });

            if (!existingOrganization) {
              throw new SecurityError('Organization not found', {
                userId,
                userRole,
                organizationId,
              });
            }

            // Delete the organization
            const deletedOrganization = await this.delete({
              where: { organization_id: organizationId },
              select: {
                organization_id: true,
                organization_name: true,
                description: true,
                organization_type: true,
                is_active: true,
                is_public: true,
                created_at: true,
                updated_at: true,
              },
            });

            return deletedOrganization;
          },
          {
            userId,
            userRole,
            operation: 'deleteOrganization',
            resource: 'organization',
            resourceId: organizationId,
            metadata: {
              deletedOrganizationName: 'organization_to_be_deleted',
            },
          },
        );
      },

      /**
       * Soft delete organization (deactivate)
       */
      async deactivateOrganization(
        this: any,
        organizationId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'organization',
          resourceId: organizationId,
        });

        // 2. Only admins can deactivate organizations
        if (userRole !== 'swarm_admin') {
          throw new SecurityError('Only admins can deactivate organizations', {
            userId,
            userRole,
            organizationId,
            operation: 'deactivateOrganization',
          });
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const updatedOrganization = await this.update({
              where: { organization_id: organizationId },
              data: {
                is_active: false,
                metadata: {
                  ...(
                    await this.findUnique({
                      where: { organization_id: organizationId },
                      select: { metadata: true },
                    })
                  )?.metadata,
                  deactivated_at: new Date().toISOString(),
                  deactivated_by: userId,
                  status: 'DEACTIVATED',
                },
                updated_at: new Date(),
              },
              select: {
                organization_id: true,
                organization_name: true,
                is_active: true,
                metadata: true,
                updated_at: true,
              },
            });

            return updatedOrganization;
          },
          {
            userId,
            userRole,
            operation: 'deactivateOrganization',
            resource: 'organization',
            resourceId: organizationId,
            metadata: {
              action: 'deactivate',
            },
          },
        );
      },

      /**
       * Bulk delete organizations (admin only)
       */
      async bulkDeleteOrganizations(
        this: any,
        organizationIds: string[],
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Only admins can bulk delete
        if (userRole !== 'swarm_admin') {
          throw new SecurityError('Bulk delete requires admin privileges', {
            userId,
            userRole,
            operation: 'bulkDeleteOrganizations',
          });
        }

        // 2. Validate function permission for admins
        if (userRole === 'swarm_admin') {
          const hasPermission = await DatabaseHelper.hasPermission(
            userId,
            'organization:delete',
          );
          if (!hasPermission) {
            throw new SecurityError('Missing organization:delete permission', {
              userId,
              requiredPermission: 'organization:delete',
            });
          }
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const results = [];

            for (const organizationId of organizationIds) {
              try {
                const deletedOrganization = await this.deleteOrganization(
                  organizationId,
                  userId,
                  userRole,
                );
                results.push({
                  success: true,
                  organization_id: organizationId,
                  organization: deletedOrganization,
                });
              } catch (error) {
                results.push({
                  success: false,
                  organization_id: organizationId,
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                });
              }
            }

            return {
              total: organizationIds.length,
              successful: results.filter((r) => r.success).length,
              failed: results.filter((r) => !r.success).length,
              results,
            };
          },
          {
            userId,
            userRole,
            operation: 'bulkDeleteOrganizations',
            resource: 'organization',
            metadata: {
              organizationIds,
              count: organizationIds.length,
            },
          },
        );
      },

      /**
       * Delete inactive organizations (admin only)
       */
      async deleteInactiveOrganizations(
        this: any,
        inactiveDays: number = 365,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Only admins can delete inactive organizations
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Deleting inactive organizations requires admin privileges',
            {
              userId,
              userRole,
              operation: 'deleteInactiveOrganizations',
            },
          );
        }

        // 2. Validate function permission for admins
        if (userRole === 'swarm_admin') {
          const hasPermission = await DatabaseHelper.hasPermission(
            userId,
            'organization:delete',
          );
          if (!hasPermission) {
            throw new SecurityError('Missing organization:delete permission', {
              userId,
              requiredPermission: 'organization:delete',
            });
          }
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

            // Find inactive organizations
            const inactiveOrganizations = await this.findMany({
              where: {
                updated_at: {
                  lt: cutoffDate,
                },
                OR: [
                  { is_active: false },
                  {
                    metadata: {
                      path: ['status'],
                      equals: 'DEACTIVATED',
                    },
                  },
                ],
              },
              select: {
                organization_id: true,
                organization_name: true,
                updated_at: true,
              },
            });

            // Delete the inactive organizations
            const deletedCount = await this.deleteMany({
              where: {
                organization_id: {
                  in: inactiveOrganizations.map(
                    (org: any) => org.organization_id,
                  ),
                },
              },
            });

            return {
              cutoffDate,
              inactiveDays,
              foundInactive: inactiveOrganizations.length,
              deletedCount: deletedCount.count,
              deletedOrganizations: inactiveOrganizations,
            };
          },
          {
            userId,
            userRole,
            operation: 'deleteInactiveOrganizations',
            resource: 'organization',
            metadata: {
              inactiveDays,
              cutoffDate: new Date(
                Date.now() - inactiveDays * 24 * 60 * 60 * 1000,
              ),
            },
          },
        );
      },
    },
  },
});

export type DeleteOrganizationExtension = typeof deleteOrganizationExtension;
