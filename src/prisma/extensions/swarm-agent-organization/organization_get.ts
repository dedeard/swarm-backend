import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for organization get operations
export interface OrganizationFilters {
  is_active?: boolean;
  organization_type?: string;
  created_after?: Date;
  created_before?: Date;
  search?: string;
}

// Enhanced Organization Get Extensions with Ultra-Simple RLS + Extension Architecture
export const getOrganizationExtension = Prisma.defineExtension({
  name: 'GetOrganizationExtension',
  model: {
    organization: {
      /**
       * Get organizations with filters and security validation
       */
      async getOrganizations(
        this: any,
        filters: OrganizationFilters = {},
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
          resource: 'organization',
          data: filters,
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {};

            // Apply role-based filtering
            if (userRole === 'swarm_user') {
              // Users can only see organizations they're members of or public ones
              where.OR = [
                { is_public: true },
                // Add user membership check if needed
              ];
            } else if (userRole === 'swarm_admin') {
              // Admins can see all organizations if they have permission
              const hasPermission = await DatabaseHelper.hasPermission(
                userId,
                'organization:read',
              );
              if (!hasPermission) {
                where.OR = [{ is_public: true }];
              }
            }

            // Apply filters
            if (filters.is_active !== undefined)
              where.is_active = filters.is_active;
            if (filters.organization_type)
              where.organization_type = filters.organization_type;

            // Date filters
            if (filters.created_after || filters.created_before) {
              where.created_at = {};
              if (filters.created_after)
                where.created_at.gte = filters.created_after;
              if (filters.created_before)
                where.created_at.lte = filters.created_before;
            }

            // Search functionality
            if (filters.search) {
              where.OR = [
                ...(where.OR || []),
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
              select: {
                organization_id: true,
                organization_name: true,
                description: true,
                organization_type: true,
                is_active: true,
                is_public: true,
                website_url: true,
                contact_email: true,
                created_at: true,
                updated_at: true,
                metadata: true,
              },
              orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
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
       * Get a single organization by ID
       */
      async getOrganization(
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
              select: {
                organization_id: true,
                organization_name: true,
                description: true,
                organization_type: true,
                is_active: true,
                is_public: true,
                website_url: true,
                contact_email: true,
                address: true,
                phone_number: true,
                metadata: true,
                created_at: true,
                updated_at: true,
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

            // Check if user can access this organization
            const canAccess =
              organization.is_public ||
              userRole === 'swarm_admin' ||
              userRole === 'swarm_admin';

            if (!canAccess) {
              throw new SecurityError('Access denied to private organization', {
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
       * Get public organizations
       */
      async getPublicOrganizations(
        this: any,
        filters: Omit<OrganizationFilters, 'is_active'> = {},
        userId?: string,
        userRole?: string,
      ) {
        return await this.getOrganizations(
          { ...filters, is_active: true },
          userId || 'public',
          userRole || 'swarm_public',
        );
      },

      /**
       * Get active organizations
       */
      async getActiveOrganizations(
        this: any,
        userId: string,
        userRole: string,
      ) {
        return await this.getOrganizations(
          { is_active: true },
          userId,
          userRole,
        );
      },

      /**
       * Get organizations by type
       */
      async getOrganizationsByType(
        this: any,
        organizationType: string,
        userId: string,
        userRole: string,
      ) {
        return await this.getOrganizations(
          { organization_type: organizationType },
          userId,
          userRole,
        );
      },
    },
  },
});

export type GetOrganizationExtension = typeof getOrganizationExtension;
