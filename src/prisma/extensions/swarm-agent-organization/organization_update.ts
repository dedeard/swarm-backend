import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for organization update operations
export interface UpdateOrganizationInput {
  organization_name?: string;
  description?: string;
  metadata?: any;
  is_public?: boolean;
  company_id?: string;
  template_id?: string;
  workflow_id?: string;
}

export interface BulkUpdateOrganizationsInput {
  organization_ids: string[];
  updates: Partial<UpdateOrganizationInput>;
}

// Enhanced Organization Update Extensions with Ultra-Simple RLS + Extension Architecture
export const updateOrganizationExtension = Prisma.defineExtension({
  name: 'UpdateOrganizationExtension',
  model: {
    organization: {
      /**
       * Update organization with full security validation
       */
      async updateOrganization(
        this: any,
        organizationId: string,
        input: UpdateOrganizationInput,
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
          data: input,
        });

        // 2. Validate organization access and input
        const validatedInput = await this.validateAndProcessUpdateInput(
          organizationId,
          input,
          userRole,
          userId,
        );

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const organization = await this.update({
              where: { organization_id: organizationId },
              data: {
                ...validatedInput,
                updated_at: new Date(),
              },
              include: {
                company: {
                  select: {
                    company_id: true,
                    name: true,
                    logo_url: true,
                  },
                },
              },
            });

            return organization;
          },
          {
            userId,
            userRole,
            operation: 'updateOrganization',
            resource: 'organization',
            resourceId: organizationId,
            metadata: { updates: Object.keys(input) },
          },
        );
      },

      /**
       * Update organization visibility
       */
      async updateOrganizationVisibility(
        this: any,
        organizationId: string,
        isPublic: boolean,
        userId: string,
        userRole: string,
      ) {
        return await this.updateOrganization(
          organizationId,
          { is_public: isPublic },
          userId,
          userRole,
        );
      },

      /**
       * Update organization metadata
       */
      async updateOrganizationMetadata(
        this: any,
        organizationId: string,
        metadata: any,
        userId: string,
        userRole: string,
      ) {
        return await this.updateOrganization(
          organizationId,
          { metadata },
          userId,
          userRole,
        );
      },

      /**
       * Update organization company association
       */
      async updateOrganizationCompany(
        this: any,
        organizationId: string,
        companyId: string | null,
        userId: string,
        userRole: string,
      ) {
        return await this.updateOrganization(
          organizationId,
          { company_id: companyId },
          userId,
          userRole,
        );
      },

      /**
       * Update organization template
       */
      async updateOrganizationTemplate(
        this: any,
        organizationId: string,
        templateId: string | null,
        userId: string,
        userRole: string,
      ) {
        return await this.updateOrganization(
          organizationId,
          { template_id: templateId },
          userId,
          userRole,
        );
      },

      /**
       * Update organization workflow
       */
      async updateOrganizationWorkflow(
        this: any,
        organizationId: string,
        workflowId: string | null,
        userId: string,
        userRole: string,
      ) {
        return await this.updateOrganization(
          organizationId,
          { workflow_id: workflowId },
          userId,
          userRole,
        );
      },

      /**
       * Bulk update organizations (admin only)
       */
      async bulkUpdateOrganizations(
        this: any,
        input: BulkUpdateOrganizationsInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate bulk update permission
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'organization',
          data: { count: input.organization_ids.length },
        });

        // 2. Validate role has bulk update permission
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Bulk organization updates require admin privileges',
            {
              userId,
              userRole,
              operation: 'bulk_update',
            },
          );
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const results = [];
            for (const organizationId of input.organization_ids) {
              try {
                // Validate access to each organization
                const hasAccess = await this.validateOrganizationUpdateAccess(
                  organizationId,
                  userId,
                  userRole,
                );
                if (!hasAccess) {
                  results.push({
                    success: false,
                    organization_id: organizationId,
                    error: 'Access denied to organization',
                  });
                  continue;
                }

                const validatedInput = await this.validateAndProcessUpdateInput(
                  organizationId,
                  input.updates,
                  userRole,
                  userId,
                );

                const organization = await this.update({
                  where: { organization_id: organizationId },
                  data: {
                    ...validatedInput,
                    updated_at: new Date(),
                  },
                  include: {
                    company: {
                      select: {
                        company_id: true,
                        name: true,
                      },
                    },
                  },
                });

                results.push({ success: true, organization });
              } catch (error) {
                results.push({
                  success: false,
                  organization_id: organizationId,
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                });
              }
            }
            return results;
          },
          {
            userId,
            userRole,
            operation: 'bulkUpdateOrganizations',
            resource: 'organization',
            metadata: { count: input.organization_ids.length },
          },
        );
      },

      /**
       * Bulk update organization visibility (admin only)
       */
      async bulkUpdateOrganizationVisibility(
        this: any,
        organizationIds: string[],
        isPublic: boolean,
        userId: string,
        userRole: string,
      ) {
        return await this.bulkUpdateOrganizations(
          {
            organization_ids: organizationIds,
            updates: { is_public: isPublic },
          },
          userId,
          userRole,
        );
      },

      // Helper methods
      async validateAndProcessUpdateInput(
        organizationId: string,
        input: UpdateOrganizationInput,
        userRole: string,
        userId: string,
      ): Promise<UpdateOrganizationInput> {
        const processed = { ...input };

        // Check if organization exists
        const organization =
          await DatabaseHelper.getOrganizationById(organizationId);
        if (!organization) {
          throw new SecurityError('Organization not found', {
            userId,
            organizationId,
          });
        }

        // Validate organization name uniqueness if name is being updated
        if (
          processed.organization_name &&
          processed.organization_name !== organization.organization_name
        ) {
          const existingOrganization =
            await DatabaseHelper.checkOrganizationNameExists(
              processed.organization_name,
              organization.user_id,
            );
          if (existingOrganization) {
            throw new SecurityError(
              'Organization name already exists for this user',
              {
                userId,
                organizationName: processed.organization_name,
                targetUserId: organization.user_id,
              },
            );
          }
        }

        // Validate access based on role
        const hasAccess = await this.validateOrganizationUpdateAccess(
          organizationId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError('Access denied to update this organization', {
            userId,
            userRole,
            organizationId,
          });
        }

        switch (userRole) {
          case 'swarm_user':
            // Users can only update their own organizations
            if (organization.user_id !== userId) {
              throw new SecurityError(
                'Users can only update their own organizations',
                {
                  userId,
                  userRole,
                  organizationId,
                  organizationOwnerId: organization.user_id,
                },
              );
            }

            // Validate company membership if updating company association
            if (processed.company_id) {
              const isMember = await DatabaseHelper.isUserInCompany(
                userId,
                processed.company_id,
              );
              if (!isMember) {
                throw new SecurityError(
                  'Not a member of the specified company',
                  {
                    userId,
                    organizationId,
                    companyId: processed.company_id,
                  },
                );
              }
            }
            break;

          case 'swarm_company_admin':
            // Company admins can update organizations they own or organizations in their managed companies
            if (organization.user_id !== userId) {
              // Check if organization belongs to a company the admin manages
              if (organization.company_id) {
                const isAdmin = await DatabaseHelper.isCompanyAdmin(
                  userId,
                  organization.company_id,
                );
                if (!isAdmin) {
                  throw new SecurityError(
                    "Not an admin of this organization's company",
                    {
                      userId,
                      organizationId,
                      companyId: organization.company_id,
                    },
                  );
                }
              } else {
                throw new SecurityError(
                  'Cannot update organizations without company association',
                  {
                    userId,
                    organizationId,
                  },
                );
              }
            }

            // Validate company admin rights if updating company association
            if (processed.company_id) {
              const isAdmin = await DatabaseHelper.isCompanyAdmin(
                userId,
                processed.company_id,
              );
              if (!isAdmin) {
                throw new SecurityError(
                  'Not an admin of the specified company',
                  {
                    userId,
                    organizationId,
                    companyId: processed.company_id,
                  },
                );
              }
            }
            break;

          case 'swarm_admin':
            // Validate function permission
            const hasPermission = await DatabaseHelper.hasPermission(
              userId,
              'organization:update',
            );
            if (!hasPermission) {
              throw new SecurityError(
                'Missing organization:update permission',
                { userId, requiredPermission: 'organization:update' },
              );
            }
            break;

          default:
            throw new SecurityError('Invalid role for organization update', {
              userId,
              userRole,
            });
        }

        return processed;
      },

      async validateOrganizationUpdateAccess(
        organizationId: string,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        const organization =
          await DatabaseHelper.getOrganizationById(organizationId);
        if (!organization) return false;

        switch (userRole) {
          case 'swarm_admin':
            return true;
          case 'swarm_company_admin':
            return (
              organization.user_id === userId ||
              (organization.company_id &&
                (await DatabaseHelper.isCompanyAdmin(
                  userId,
                  organization.company_id,
                )))
            );
          case 'swarm_user':
            return organization.user_id === userId;
          default:
            return false;
        }
      },
    },
  },
});
