import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import { PermissionValidator } from '../../shared/permission-validator';

// Type definitions for organization search operations
export interface SearchOrganizationsInput {
  query?: string;
  organization_type?: string;
  is_active?: boolean;
  is_public?: boolean;
  created_after?: Date;
  created_before?: Date;
  location?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'organization_name';
  sort_order?: 'asc' | 'desc';
}

export interface ComplexSearchOrganizationsInput {
  filters: {
    basic?: {
      query?: string;
      organization_type?: string;
      is_active?: boolean;
      is_public?: boolean;
    };
    temporal?: {
      created_after?: Date;
      created_before?: Date;
      updated_after?: Date;
      updated_before?: Date;
    };
    location?: {
      address?: string;
      city?: string;
      country?: string;
    };
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
}

// Enhanced Organization Search Extensions with Ultra-Simple RLS + Extension Architecture
export const searchOrganizationExtension = Prisma.defineExtension({
  name: 'SearchOrganizationExtension',
  model: {
    organization: {
      /**
       * Search organizations with comprehensive filters
       */
      async searchOrganizations(
        this: any,
        input: SearchOrganizationsInput,
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
          data: input,
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {};

            // Apply role-based filtering
            if (userRole === 'swarm_user') {
              // Users can only search public organizations
              where.is_public = true;
            } else if (userRole === 'swarm_admin') {
              // Admins can search all organizations if they have permission
              const hasPermission = await DatabaseHelper.hasPermission(
                userId,
                'organization:read',
              );
              if (!hasPermission) {
                where.is_public = true;
              }
            } else if (userRole === 'swarm_public') {
              // Public users can only search public organizations
              where.is_public = true;
            }

            // Apply search filters
            if (input.query) {
              const searchConditions = [
                {
                  organization_name: {
                    contains: input.query,
                    mode: 'insensitive',
                  },
                },
                { description: { contains: input.query, mode: 'insensitive' } },
              ];

              if (where.is_public !== undefined) {
                where.AND = [
                  { is_public: where.is_public },
                  { OR: searchConditions },
                ];
                delete where.is_public;
              } else {
                where.OR = searchConditions;
              }
            }

            // Apply specific filters
            if (input.organization_type)
              where.organization_type = input.organization_type;
            if (input.is_active !== undefined)
              where.is_active = input.is_active;
            if (input.is_public !== undefined && !where.AND)
              where.is_public = input.is_public;

            // Date filters
            if (input.created_after || input.created_before) {
              where.created_at = {};
              if (input.created_after)
                where.created_at.gte = input.created_after;
              if (input.created_before)
                where.created_at.lte = input.created_before;
            }

            // Location filter
            if (input.location) {
              where.address = { contains: input.location, mode: 'insensitive' };
            }

            // Build orderBy
            const orderBy: any[] = [];
            if (input.sort_by && input.sort_order) {
              orderBy.push({ [input.sort_by]: input.sort_order });
            } else {
              orderBy.push({ created_at: 'desc' });
            }

            const results = await this.findMany({
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
                address: true,
                phone_number: true,
                created_at: true,
                updated_at: true,
                metadata: true,
              },
              orderBy,
              take: input.limit || 50,
              skip: input.offset || 0,
            });

            // Get total count for pagination
            const total = await this.count({ where });

            return {
              results,
              pagination: {
                total,
                limit: input.limit || 50,
                offset: input.offset || 0,
                has_more: (input.offset || 0) + results.length < total,
              },
              filters_applied: input,
            };
          },
          {
            userId,
            userRole,
            operation: 'searchOrganizations',
            resource: 'organization',
            metadata: {
              query: input.query,
              filters: Object.keys(input).length,
            },
          },
        );
      },

      /**
       * Complex search with advanced filtering
       */
      async searchOrganizationsComplex(
        this: any,
        input: ComplexSearchOrganizationsInput,
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
          data: input,
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = {};
            const andConditions: any[] = [];

            // Apply role-based filtering
            if (userRole === 'swarm_user') {
              andConditions.push({ is_public: true });
            } else if (userRole === 'swarm_admin') {
              const hasPermission = await DatabaseHelper.hasPermission(
                userId,
                'organization:read',
              );
              if (!hasPermission) {
                andConditions.push({ is_public: true });
              }
            } else if (userRole === 'swarm_public') {
              andConditions.push({ is_public: true });
            }

            // Basic filters
            if (input.filters?.basic) {
              const basic = input.filters.basic;

              if (basic.query) {
                andConditions.push({
                  OR: [
                    {
                      organization_name: {
                        contains: basic.query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: basic.query,
                        mode: 'insensitive',
                      },
                    },
                  ],
                });
              }

              if (basic.organization_type) {
                andConditions.push({
                  organization_type: basic.organization_type,
                });
              }

              if (basic.is_active !== undefined) {
                andConditions.push({ is_active: basic.is_active });
              }

              if (basic.is_public !== undefined) {
                andConditions.push({ is_public: basic.is_public });
              }
            }

            // Temporal filters
            if (input.filters?.temporal) {
              const temporal = input.filters.temporal;

              if (temporal.created_after || temporal.created_before) {
                const createdAt: any = {};
                if (temporal.created_after)
                  createdAt.gte = temporal.created_after;
                if (temporal.created_before)
                  createdAt.lte = temporal.created_before;
                andConditions.push({ created_at: createdAt });
              }

              if (temporal.updated_after || temporal.updated_before) {
                const updatedAt: any = {};
                if (temporal.updated_after)
                  updatedAt.gte = temporal.updated_after;
                if (temporal.updated_before)
                  updatedAt.lte = temporal.updated_before;
                andConditions.push({ updated_at: updatedAt });
              }
            }

            // Location filters
            if (input.filters?.location) {
              const location = input.filters.location;

              if (location.address) {
                andConditions.push({
                  address: { contains: location.address, mode: 'insensitive' },
                });
              }

              if (location.city) {
                andConditions.push({
                  OR: [
                    {
                      address: { contains: location.city, mode: 'insensitive' },
                    },
                    {
                      metadata: {
                        path: ['city'],
                        string_contains: location.city,
                      },
                    },
                  ],
                });
              }

              if (location.country) {
                andConditions.push({
                  OR: [
                    {
                      address: {
                        contains: location.country,
                        mode: 'insensitive',
                      },
                    },
                    {
                      metadata: {
                        path: ['country'],
                        string_contains: location.country,
                      },
                    },
                  ],
                });
              }
            }

            // Combine all conditions
            if (andConditions.length > 0) {
              where.AND = andConditions;
            }

            // Build orderBy from sorting configuration
            const orderBy: any[] = [];
            if (input.sorting && input.sorting.length > 0) {
              input.sorting.forEach((sort) => {
                orderBy.push({ [sort.field]: sort.direction });
              });
            } else {
              orderBy.push({ created_at: 'desc' });
            }

            const limit = input.pagination?.limit || 50;
            const offset = input.pagination?.offset || 0;

            const results = await this.findMany({
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
                address: true,
                phone_number: true,
                created_at: true,
                updated_at: true,
                metadata: true,
              },
              orderBy,
              take: limit,
              skip: offset,
            });

            const total = await this.count({ where });

            return {
              results,
              pagination: {
                total,
                limit,
                offset,
                has_more: offset + results.length < total,
                page: Math.floor(offset / limit) + 1,
                total_pages: Math.ceil(total / limit),
              },
              filters_applied: input.filters,
              sorting_applied: input.sorting,
            };
          },
          {
            userId,
            userRole,
            operation: 'searchOrganizationsComplex',
            resource: 'organization',
            metadata: {
              complex_search: true,
              filter_categories: Object.keys(input.filters || {}).length,
            },
          },
        );
      },

      /**
       * Search organizations by type
       */
      async searchOrganizationsByType(
        this: any,
        organizationType: string,
        query?: string,
        userId?: string,
        userRole?: string,
      ) {
        return await this.searchOrganizations(
          { organization_type: organizationType, query },
          userId || 'public',
          userRole || 'swarm_public',
        );
      },

      /**
       * Search public organizations
       */
      async searchPublicOrganizations(
        this: any,
        query?: string,
        userId?: string,
        userRole?: string,
      ) {
        return await this.searchOrganizations(
          { query, is_public: true },
          userId || 'public',
          userRole || 'swarm_public',
        );
      },

      /**
       * Search active organizations
       */
      async searchActiveOrganizations(
        this: any,
        query?: string,
        userId?: string,
        userRole?: string,
      ) {
        return await this.searchOrganizations(
          { query, is_active: true },
          userId || 'public',
          userRole || 'swarm_public',
        );
      },
    },
  },
});

export type SearchOrganizationExtension = typeof searchOrganizationExtension;
