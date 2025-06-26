import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for agent category creation operations with enhanced security
export interface CreateAgentCategoryInput {
  category_name?: string;
  name?: string; // Alternative field name for backward compatibility
  description?: string;
  company_id?: string;
  icon_url?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface BulkCreateCategoryInput {
  categories: CreateAgentCategoryInput[];
  default_company_id?: string;
}

// Helper function to get category name from either field
function getCategoryName(input: CreateAgentCategoryInput): string {
  return input.category_name || input.name || '';
}

// Type for category with relations
type CategoryWithRelations = Prisma.AgentCategoryGetPayload<{
  include: {
    agents: true;
    prompts: true;
    templates: true;
  };
}>;

// Enhanced Agent Category Creation Extensions with Ultra-Simple RLS + Extension Architecture
export const categoryCreateExtension = Prisma.defineExtension({
  name: 'CategoryCreateExtension',
  model: {
    agentCategory: {
      // Create a new agent category with enhanced security
      async createAgentCategory(
        this: any,
        input: CreateAgentCategoryInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Get category name from either field
        const categoryName = getCategoryName(input);

        // Validate required fields
        if (!input || !categoryName || categoryName.trim() === '') {
          throw new SecurityError(
            'Missing required field: category_name or name',
            {
              userId,
              userRole,
              input: input || {},
              missingField: 'category_name or name',
            },
          );
        }

        // 1. Validate permissions for category creation
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent',
          data: { category_creation: true, ...input },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Create the category (removed sort_order logic since it doesn't exist in schema)
            const category = await this.create({
              data: {
                name: categoryName.trim(),
                description: input.description?.trim() || null,
                metadata: {
                  company_id: input.company_id,
                  icon_url: input.icon_url,
                  color: input.color,
                  is_active:
                    input.is_active !== undefined ? input.is_active : true,
                },
                created_at: new Date(),
              },
              include: {
                agents: true,
                prompts: true,
                templates: true,
              },
            });

            return category;
          },
          {
            userId,
            userRole,
            operation: 'createAgentCategory',
            resource: 'agent',
            metadata: {
              categoryName: categoryName,
              companyId: input.company_id,
            },
          },
        );
      },

      // Create category with validation
      async createValidatedAgentCategory(
        this: any,
        input: CreateAgentCategoryInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Get category name from either field
        const categoryName = getCategoryName(input);

        // Validate required fields
        if (!input || !categoryName || categoryName.trim() === '') {
          throw new SecurityError(
            'Missing required field: category_name or name',
            {
              userId,
              userRole,
              input: input || {},
              missingField: 'category_name or name',
            },
          );
        }

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent',
          data: { category_creation: true, validated: true, ...input },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Check for duplicate category name within company
            if (input.company_id) {
              const existingCategory = await this.findFirst({
                where: {
                  name: categoryName.trim(),
                  metadata: {
                    path: ['company_id'],
                    equals: input.company_id,
                  },
                },
              });

              if (existingCategory) {
                throw new SecurityError(
                  'Category name already exists in this company',
                  {
                    userId,
                    userRole,
                    categoryName: categoryName,
                    companyId: input.company_id,
                  },
                );
              }
            }

            // Validate company access if specified
            if (input.company_id) {
              const hasCompanyAccess = await DatabaseHelper.isUserInCompany(
                userId,
                input.company_id,
              );
              if (!hasCompanyAccess) {
                throw new SecurityError('Access denied to specified company', {
                  userId,
                  userRole,
                  companyId: input.company_id,
                });
              }
            }

            // Create the category (removed sort_order logic since it doesn't exist in schema)
            const category = await this.create({
              data: {
                name: categoryName.trim(),
                description: input.description?.trim() || null,
                metadata: {
                  company_id: input.company_id,
                  icon_url: input.icon_url,
                  color: input.color,
                  is_active:
                    input.is_active !== undefined ? input.is_active : true,
                },
                created_at: new Date(),
              },
              include: {
                agents: true,
                prompts: true,
                templates: true,
              },
            });

            return category;
          },
          {
            userId,
            userRole,
            operation: 'createValidatedAgentCategory',
            resource: 'agent',
            metadata: {
              categoryName: categoryName,
              companyId: input.company_id,
              validated: true,
            },
          },
        );
      },

      // Bulk create categories
      async bulkCreateAgentCategories(
        this: any,
        input: BulkCreateCategoryInput,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for bulk category creation
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'create',
          resource: 'agent',
          data: {
            bulk_category_creation: true,
            categories: input.categories,
            default_company_id: input.default_company_id,
          },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const createdCategories: CategoryWithRelations[] = [];
            const errors: { category_name: string; error: string }[] = [];

            for (const categoryInput of input.categories) {
              try {
                // Use default company if not specified
                const finalInput = {
                  ...categoryInput,
                  company_id:
                    categoryInput.company_id || input.default_company_id,
                };

                // Validate company access if specified
                if (finalInput.company_id) {
                  const hasCompanyAccess = await DatabaseHelper.isUserInCompany(
                    userId,
                    finalInput.company_id,
                  );
                  if (!hasCompanyAccess) {
                    throw new SecurityError(
                      'Access denied to specified company',
                      {
                        userId,
                        userRole,
                        companyId: finalInput.company_id,
                      },
                    );
                  }
                }

                // Get category name from either field
                const finalCategoryName = getCategoryName(finalInput);

                // Validate required fields for each category
                if (!finalCategoryName || finalCategoryName.trim() === '') {
                  throw new SecurityError(
                    'Missing required field: category_name or name',
                    {
                      userId,
                      userRole,
                      categoryInput: finalInput,
                      missingField: 'category_name or name',
                    },
                  );
                }

                // Create the category (removed sort_order logic since it doesn't exist in schema)
                const category = await this.create({
                  data: {
                    name: finalCategoryName.trim(),
                    description: finalInput.description?.trim() || null,
                    metadata: {
                      company_id: finalInput.company_id,
                      icon_url: finalInput.icon_url,
                      color: finalInput.color,
                      is_active:
                        finalInput.is_active !== undefined
                          ? finalInput.is_active
                          : true,
                    },
                    created_at: new Date(),
                  },
                  include: {
                    agents: true,
                    prompts: true,
                    templates: true,
                  },
                });

                createdCategories.push(category);
              } catch (error) {
                errors.push({
                  category_name: getCategoryName(categoryInput),
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }

            return {
              created_categories: createdCategories,
              errors: errors,
              success_count: createdCategories.length,
              error_count: errors.length,
            };
          },
          {
            userId,
            userRole,
            operation: 'bulkCreateAgentCategories',
            resource: 'agent',
            metadata: {
              categoryCount: input.categories.length,
              defaultCompanyId: input.default_company_id,
            },
          },
        );
      },

      // Create category with template
      async createCategoryFromTemplate(
        this: any,
        templateName: string,
        customizations: Partial<CreateAgentCategoryInput>,
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
          resource: 'agent',
          data: {
            category_from_template: true,
            template_name: templateName,
            customizations,
          },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Define category templates
            const templates = {
              customer_service: {
                category_name: 'Customer Service',
                description: 'Agents focused on customer support and service',
                icon_url: '/icons/customer-service.svg',
                color: '#3B82F6',
                is_active: true,
              },
              sales: {
                category_name: 'Sales',
                description: 'Agents for sales and lead generation',
                icon_url: '/icons/sales.svg',
                color: '#10B981',
                is_active: true,
              },
              technical: {
                category_name: 'Technical Support',
                description:
                  'Agents for technical assistance and troubleshooting',
                icon_url: '/icons/technical.svg',
                color: '#8B5CF6',
                is_active: true,
              },
              marketing: {
                category_name: 'Marketing',
                description: 'Agents for marketing and promotional activities',
                icon_url: '/icons/marketing.svg',
                color: '#F59E0B',
                is_active: true,
              },
            };

            const template = templates[templateName as keyof typeof templates];
            if (!template) {
              throw new SecurityError('Invalid template name', {
                userId,
                userRole,
                templateName,
                availableTemplates: Object.keys(templates),
              });
            }

            // Merge template with customizations
            const categoryInput = {
              ...template,
              ...customizations,
            };

            // Validate company access if specified
            if (categoryInput.company_id) {
              const hasCompanyAccess = await DatabaseHelper.isUserInCompany(
                userId,
                categoryInput.company_id,
              );
              if (!hasCompanyAccess) {
                throw new SecurityError('Access denied to specified company', {
                  userId,
                  userRole,
                  companyId: categoryInput.company_id,
                });
              }
            }

            // Get category name from either field
            const templateCategoryName = getCategoryName(categoryInput);

            // Validate required fields
            if (!templateCategoryName || templateCategoryName.trim() === '') {
              throw new SecurityError(
                'Missing required field: category_name or name',
                {
                  userId,
                  userRole,
                  templateName,
                  categoryInput,
                  missingField: 'category_name or name',
                },
              );
            }

            // Create the category (removed sort_order logic since it doesn't exist in schema)
            const category = await this.create({
              data: {
                name: templateCategoryName.trim(),
                description: categoryInput.description?.trim() || null,
                metadata: {
                  company_id: categoryInput.company_id,
                  icon_url: categoryInput.icon_url,
                  color: categoryInput.color,
                  is_active:
                    categoryInput.is_active !== undefined
                      ? categoryInput.is_active
                      : true,
                },
                created_at: new Date(),
              },
              include: {
                agents: true,
                prompts: true,
                templates: true,
              },
            });

            return category;
          },
          {
            userId,
            userRole,
            operation: 'createCategoryFromTemplate',
            resource: 'agent',
            metadata: {
              templateName,
              categoryName: customizations.category_name || templateName,
              companyId: customizations.company_id,
            },
          },
        );
      },
    },
  },
});

export type CategoryCreateExtension = typeof categoryCreateExtension;
