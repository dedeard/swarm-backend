import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for organization operations
export interface CreateOrganizationInput {
  user_id: string;
  company_id?: string;
  template_id?: string;
  workflow_id?: string;
  organization_name: string;
  description?: string;
  metadata?: any;
  is_public?: boolean;
}

export interface OrganizationFilters {
  user_id?: string;
  company_id?: string;
  is_public?: boolean;
  search?: string;
}

// Enhanced Organization Creation Extensions with Ultra-Simple RLS + Extension Architecture
export const createOrganizationExtension = Prisma.defineExtension({
  name: 'CreateOrganizationExtension',
  model: {
    organization: {
      /**
       * Create organization with full security validation
       */
      async createOrganization(
        this: any,
        input: CreateOrganizationInput,
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
          resource: 'organization',
          data: input,
        });

        // 2. Apply role-specific business rules and validation
        const validatedInput = await this.validateAndProcessCreateInput(
          input,
          userRole,
          userId,
        );

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const organization = await this.create({
              data: {
                ...validatedInput,
                created_at: new Date(),
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
            operation: 'createOrganization',
            resource: 'organization',
            metadata: {
              organizationName: input.organization_name,
              companyId: input.company_id,
              targetUserId: input.user_id,
            },
          },
        );
      },

      /**
       * Create organization with default settings
       */
      async createOrganizationWithDefaults(
        this: any,
        input: Omit<CreateOrganizationInput, 'organization_name'> & {
          organization_name: string;
        },
        userId: string,
        userRole: string,
      ) {
        const defaultInput: CreateOrganizationInput = {
          ...input,
          is_public: input.is_public ?? false,
        };

        return await this.createOrganization(defaultInput, userId, userRole);
      },

      /**
       * Bulk create organizations (admin only)
       */
      async bulkCreateOrganizations(
        this: any,
        organizations: CreateOrganizationInput[],
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate bulk create permission
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'organization',
          data: { count: organizations.length },
        });

        // 2. Validate role has bulk create permission
        if (userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Bulk organization creation requires admin privileges',
            {
              userId,
              userRole,
              operation: 'bulk_create',
            },
          );
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            type BulkCreateResult =
              | { success: true; organization: any }
              | {
                  success: false;
                  error: string;
                  organizationName: string;
                };
            const results: BulkCreateResult[] = [];
            for (const orgInput of organizations) {
              try {
                const validatedInput = await this.validateAndProcessCreateInput(
                  orgInput,
                  userRole,
                  userId,
                );
                const organization = await this.create({
                  data: {
                    ...validatedInput,
                    created_at: new Date(),
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
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  organizationName: orgInput.organization_name,
                });
              }
            }
            return results;
          },
          {
            userId,
            userRole,
            operation: 'bulkCreateOrganizations',
            resource: 'organization',
            metadata: { count: organizations.length },
          },
        );
      },

      /**
       * Get organizations with role-based filtering
       */
      async getOrganizations(
        this: any,
        filters: OrganizationFilters = {},
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate read permission
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'organization',
          data: filters,
        });

        // 2. Apply role-specific filters
        const secureFilters = await this.buildSecureFilters(
          filters,
          userRole,
          userId,
        );

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            return await this.findMany({
              where: secureFilters,
              include: {
                company: {
                  select: {
                    company_id: true,
                    name: true,
                    logo_url: true,
                  },
                },
              },
              orderBy: {
                created_at: 'desc',
              },
            });
          },
          {
            userId,
            userRole,
            operation: 'getOrganizations',
            resource: 'organization',
            metadata: { filters },
          },
        );
      },

      /**
       * Get a single organization with security validation
       */
      async getOrganization(
        this: any,
        organizationId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate read permission
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'organization',
          resourceId: organizationId,
        });

        // 2. Execute with admin context
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
                    logo_url: true,
                  },
                },
              },
            });

            if (!organization) {
              throw new SecurityError(
                'Organization not found or access denied',
                {
                  userId,
                  userRole,
                  organizationId,
                },
              );
            }

            // Additional access validation based on role
            const hasAccess = await this.validateOrganizationAccess(
              organization,
              userId,
              userRole,
            );
            if (!hasAccess) {
              throw new SecurityError('Access denied to this organization', {
                userId,
                userRole,
                organizationId,
              });
            }

            return organization;
          },
          {
            userId,
            userRole,
            operation: 'getOrganization',
            resource: 'organization',
            resourceId: organizationId,
          },
        );
      },

      /**
       * Get public organizations (accessible to all roles)
       */
      async getPublicOrganizations(
        this: any,
        filters: Omit<OrganizationFilters, 'user_id'> = {},
      ) {
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {
              is_public: true,
            };

            if (filters.company_id) {
              where.company_id = filters.company_id;
            }
            if (filters.search) {
              where.OR = [
                {
                  organization_name: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              ];
            }

            return await this.findMany({
              where,
              include: {
                company: {
                  select: {
                    company_id: true,
                    name: true,
                    logo_url: true,
                  },
                },
              },
              orderBy: {
                created_at: 'desc',
              },
            });
          },
          {
            userId: 'system',
            userRole: 'system',
            operation: 'getPublicOrganizations',
            resource: 'organization',
            metadata: { filters },
          },
        );
      },

      /**
       * Get organizations by user
       */
      async getOrganizationsByUser(
        this: any,
        targetUserId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate user access
        const hasUserAccess = await DatabaseHelper.canAccessUserProfile(
          userId,
          targetUserId,
          userRole,
        );
        if (!hasUserAccess && userRole !== 'swarm_admin') {
          throw new SecurityError('Access denied to user organizations', {
            userId,
            userRole,
            targetUserId,
          });
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            return await this.findMany({
              where: {
                user_id: targetUserId,
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
              orderBy: {
                created_at: 'desc',
              },
            });
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationsByUser',
            resource: 'organization',
            metadata: { targetUserId },
          },
        );
      },

      /**
       * Get organizations by company
       */
      async getOrganizationsByCompany(
        this: any,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate company access
        const hasCompanyAccess = await DatabaseHelper.isUserInCompany(
          userId,
          companyId,
        );
        if (!hasCompanyAccess && userRole !== 'swarm_admin') {
          throw new SecurityError('Access denied to company organizations', {
            userId,
            userRole,
            companyId,
          });
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            return await this.findMany({
              where: {
                company_id: companyId,
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
              orderBy: {
                created_at: 'desc',
              },
            });
          },
          {
            userId,
            userRole,
            operation: 'getOrganizationsByCompany',
            resource: 'organization',
            metadata: { companyId },
          },
        );
      },

      // Helper methods
      async validateAndProcessCreateInput(
        input: CreateOrganizationInput,
        userRole: string,
        userId: string,
      ): Promise<CreateOrganizationInput> {
        const processed = { ...input };

        // Validate organization name uniqueness for the user
        const existingOrganization =
          await DatabaseHelper.checkOrganizationNameExists(
            processed.organization_name,
            processed.user_id,
          );
        if (existingOrganization) {
          throw new SecurityError(
            'Organization name already exists for this user',
            {
              userId,
              organizationName: processed.organization_name,
              targetUserId: processed.user_id,
            },
          );
        }

        switch (userRole) {
          case 'swarm_user':
            // Users can only create organizations for themselves
            if (processed.user_id !== userId) {
              throw new SecurityError(
                'Users can only create organizations for themselves',
                { userId, targetUserId: processed.user_id },
              );
            }

            // Validate company membership if creating for a company
            if (processed.company_id) {
              const isMember = await DatabaseHelper.isUserInCompany(
                userId,
                processed.company_id,
              );
              if (!isMember) {
                throw new SecurityError(
                  'Cannot create organizations for companies you are not a member of',
                  {
                    userId,
                    companyId: processed.company_id,
                  },
                );
              }
            }
            break;

          case 'swarm_company_admin':
            // Company admins can create organizations for users in their companies
            if (processed.user_id !== userId) {
              // Check if target user is in any of the admin's companies
              const adminCompanies =
                await DatabaseHelper.getUserAdminCompanies(userId);
              const targetUserCompanies = await DatabaseHelper.getUserCompanies(
                processed.user_id,
              );
              const hasCommonCompany = adminCompanies.some((companyId) =>
                targetUserCompanies.includes(companyId),
              );

              if (!hasCommonCompany) {
                throw new SecurityError(
                  'Cannot create organizations for users not in your companies',
                  {
                    userId,
                    targetUserId: processed.user_id,
                  },
                );
              }
            }

            // Validate company admin rights if specifying a company
            if (processed.company_id) {
              const isAdmin = await DatabaseHelper.isCompanyAdmin(
                userId,
                processed.company_id,
              );
              if (!isAdmin) {
                throw new SecurityError(
                  'Cannot create organizations for companies you do not admin',
                  {
                    userId,
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
              'organization:create',
            );
            if (!hasPermission) {
              throw new SecurityError(
                'Missing organization:create permission',
                { userId, requiredPermission: 'organization:create' },
              );
            }
            break;

          default:
            throw new SecurityError('Invalid role for organization creation', {
              userId,
              userRole,
            });
        }

        return processed;
      },

      async buildSecureFilters(
        filters: OrganizationFilters,
        userRole: string,
        userId: string,
      ): Promise<any> {
        const where: any = { ...filters };

        // Apply search filters
        if (filters.search) {
          where.OR = [
            {
              organization_name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ];
          delete where.search;
        }

        switch (userRole) {
          case 'swarm_user':
            // Can see own organizations, company organizations, and public organizations
            const userCompanies = await DatabaseHelper.getUserCompanies(userId);
            where.OR = [
              { user_id: userId },
              { company_id: { in: userCompanies } },
              { is_public: true },
            ];
            break;

          case 'swarm_company_admin':
            // Can see organizations from managed companies and public organizations
            const adminCompanies =
              await DatabaseHelper.getUserAdminCompanies(userId);
            const memberCompanies =
              await DatabaseHelper.getUserCompanies(userId);
            const allCompanies = [
              ...new Set([...adminCompanies, ...memberCompanies]),
            ];
            where.OR = [
              { user_id: userId },
              { company_id: { in: allCompanies } },
              { is_public: true },
            ];
            break;

          case 'swarm_admin':
            // Check function permission
            const hasReadPermission = await DatabaseHelper.hasPermission(
              userId,
              'organization:read',
            );
            if (!hasReadPermission) {
              throw new SecurityError('Missing organization:read permission', {
                userId,
                requiredPermission: 'organization:read',
              });
            }
            // If has permission, can see all (no additional filters)
            break;

          case 'swarm_public':
            // Only public organizations
            where.is_public = true;
            break;

          default:
            throw new SecurityError('Invalid role for organization access', {
              userId,
              userRole,
            });
        }

        return where;
      },

      async validateOrganizationAccess(
        organization: any,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        switch (userRole) {
          case 'swarm_admin':
            return true;
          case 'swarm_company_admin':
            return (
              organization.company_id &&
              (await DatabaseHelper.isUserInCompany(
                userId,
                organization.company_id,
              ))
            );
          case 'swarm_user':
            return organization.user_id === userId || organization.is_public;
          default:
            return organization.is_public;
        }
      },
    },
  },
});
