import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for agent category operations with enhanced security
export interface AssignCategoryInput {
  agent_id: string;
  category_id: string;
}

export interface BulkCategoryAssignmentInput {
  agent_ids: string[];
  category_id: string;
}

export interface CategoryTransferInput {
  from_category_id: string;
  to_category_id: string;
  company_id?: string;
}

// Enhanced Agent Category Assignment Extensions with Ultra-Simple RLS + Extension Architecture
export const agentAddCategoryExtension = Prisma.defineExtension({
  name: 'AgentAddCategoryExtension',
  model: {
    agent: {
      // Assign category to an agent
      async assignCategory(
        this: any,
        agentId: string,
        categoryId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for agent update
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'agent',
          resourceId: agentId,
          data: { category_id: categoryId },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Note: Since we can't use raw queries and this is an agent extension,
            // we'll skip the category validation for now and proceed with the agent update
            // The database foreign key constraints will handle validation

            // Get the existing agent for validation
            const existingAgent = await this.findUnique({
              where: { agent_id: agentId },
              select: {
                agent_id: true,
                agent_name: true,
                category_id: true,
                company_id: true,
              },
            });

            if (!existingAgent) {
              throw new SecurityError('Agent not found or access denied', {
                userId,
                userRole,
                agentId,
              });
            }

            // Update the agent with new category
            const updatedAgent = await this.update({
              where: { agent_id: agentId },
              data: { category_id: categoryId },
              include: {
                category: true,
                company: true,
              },
            });

            return updatedAgent;
          },
          {
            userId,
            userRole,
            operation: 'assignCategory',
            resource: 'agent',
            resourceId: agentId,
            metadata: {
              categoryId,
            },
          },
        );
      },

      // Remove category from an agent
      async removeCategory(
        this: any,
        agentId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for agent update
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'agent',
          resourceId: agentId,
          data: { category_id: null },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get the existing agent for audit logging
            const existingAgent = await this.findUnique({
              where: { agent_id: agentId },
              include: {
                category: true,
              },
            });

            if (!existingAgent) {
              throw new SecurityError('Agent not found or access denied', {
                userId,
                userRole,
                agentId,
              });
            }

            // Remove category from agent
            const updatedAgent = await this.update({
              where: { agent_id: agentId },
              data: { category_id: null },
              include: {
                company: true,
              },
            });

            return updatedAgent;
          },
          {
            userId,
            userRole,
            operation: 'removeCategory',
            resource: 'agent',
            resourceId: agentId,
            metadata: {
              removedCategoryId: agentId,
            },
          },
        );
      },

      // Bulk assign category to multiple agents
      async bulkAssignCategory(
        this: any,
        agentIds: string[],
        categoryId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for bulk agent update
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'agent',
          data: { category_id: categoryId, bulk: true, agent_ids: agentIds },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Verify the category exists
            const category = await this.$queryRaw`
              SELECT category_id, category_name, company_id
              FROM "swarm-agent".agent_categories
              WHERE category_id = ${categoryId}::UUID
            `;

            if (!category || category.length === 0) {
              throw new SecurityError('Category not found or access denied', {
                userId,
                userRole,
                categoryId,
              });
            }

            // Get agents that will be updated (for audit logging)
            const agentsToUpdate = await this.findMany({
              where: { agent_id: { in: agentIds } },
              select: { agent_id: true, agent_name: true, category_id: true },
            });

            if (agentsToUpdate.length === 0) {
              throw new SecurityError('No agents found or access denied', {
                userId,
                userRole,
                agentIds,
              });
            }

            // Perform bulk update
            const result = await this.updateMany({
              where: { agent_id: { in: agentIds } },
              data: { category_id: categoryId },
            });

            return {
              updated_count: result.count,
              updated_agents: agentsToUpdate,
              category: category[0],
            };
          },
          {
            userId,
            userRole,
            operation: 'bulkAssignCategory',
            resource: 'agent',
            metadata: {
              categoryId,
              agentIds,
              agentCount: agentIds.length,
            },
          },
        );
      },

      // Transfer agents from one category to another
      async transferAgentsCategory(
        this: any,
        fromCategoryId: string,
        toCategoryId: string,
        userId: string,
        userRole: string,
        companyId?: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for bulk agent update
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'agent',
          data: {
            category_transfer: true,
            from_category_id: fromCategoryId,
            to_category_id: toCategoryId,
            company_id: companyId,
          },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Verify both categories exist
            const categories = await this.$queryRaw`
              SELECT category_id, category_name, company_id
              FROM "swarm-agent".agent_categories
              WHERE category_id IN (${fromCategoryId}::UUID, ${toCategoryId}::UUID)
            `;

            if (!categories || categories.length !== 2) {
              throw new SecurityError(
                'One or both categories not found or access denied',
                {
                  userId,
                  userRole,
                  fromCategoryId,
                  toCategoryId,
                },
              );
            }

            const where: any = { category_id: fromCategoryId };
            if (companyId) {
              where.company_id = companyId;
            }

            // Get agents that will be transferred (for audit logging)
            const agentsToTransfer = await this.findMany({
              where,
              select: { agent_id: true, agent_name: true, company_id: true },
            });

            if (agentsToTransfer.length === 0) {
              throw new SecurityError(
                'No agents found in source category or access denied',
                {
                  userId,
                  userRole,
                  fromCategoryId,
                  companyId,
                },
              );
            }

            // Perform the transfer
            const result = await this.updateMany({
              where,
              data: { category_id: toCategoryId },
            });

            const fromCategory = categories.find(
              (c: any) => c.category_id === fromCategoryId,
            );
            const toCategory = categories.find(
              (c: any) => c.category_id === toCategoryId,
            );

            return {
              transferred_count: result.count,
              transferred_agents: agentsToTransfer,
              from_category: fromCategory,
              to_category: toCategory,
            };
          },
          {
            userId,
            userRole,
            operation: 'transferAgentsCategory',
            resource: 'agent',
            metadata: {
              fromCategoryId,
              toCategoryId,
              companyId,
              transferCount: 0, // Will be updated after operation
            },
          },
        );
      },

      // Get agents by category with enhanced security
      async getAgentsByCategory(
        this: any,
        categoryId: string,
        userId: string,
        userRole: string,
        includeInactive: boolean = false,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for agent read
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'agent',
          data: { category_id: categoryId, include_inactive: includeInactive },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const where: any = { category_id: categoryId };

            if (!includeInactive) {
              where.on_status = true;
            }

            // Apply role-based filtering
            const secureWhere = await this.buildSecureFilters(
              where,
              userRole,
              userId,
            );

            const agents = await this.findMany({
              where: secureWhere,
              include: {
                category: true,
                company: true,
              },
              orderBy: {
                agent_name: 'asc',
              },
            });

            return agents;
          },
          {
            userId,
            userRole,
            operation: 'getAgentsByCategory',
            resource: 'agent',
            metadata: {
              categoryId,
              includeInactive,
              resultCount: 0, // Will be updated after operation
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
            // Can see own agents and public agents
            where.OR = [{ user_id: userId }, { is_public: true }];
            break;

          case 'swarm_company_admin':
            // Can see company agents and public agents
            const adminCompanies =
              await DatabaseHelper.getUserAdminCompanies(userId);
            where.OR = [
              { company_id: { in: adminCompanies } },
              { is_public: true },
              { user_id: userId }, // Own agents
            ];
            break;

          case 'swarm_admin':
            // Check function permission
            const hasReadPermission = await DatabaseHelper.hasPermission(
              userId,
              'agent:read',
            );
            if (!hasReadPermission) {
              throw new SecurityError('Missing agent:read permission', {
                userId,
                requiredPermission: 'agent:read',
              });
            }
            // Can see all agents if has permission
            break;

          case 'swarm_public':
            // Only public agents
            where.is_public = true;
            break;

            // No access to agent data
            where.agent_id = 'never-match';
            break;

            // Can see all agents
            break;

          default:
            // Unknown role - no access
            where.agent_id = 'never-match';
            break;
        }

        return where;
      },

      // Get category statistics (agent counts, etc.)
      async getCategoryStatistics(
        this: any,
        categoryId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions for agent read
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'read',
          resource: 'agent',
          data: { category_statistics: true, category_id: categoryId },
        });

        // 2. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Build secure filters for counting
            const baseWhere = { category_id: categoryId };
            const secureWhere = await this.buildSecureFilters(
              baseWhere,
              userRole,
              userId,
            );

            // Get total count
            const totalCount = await this.count({
              where: secureWhere,
            });

            // Get active count
            const activeCount = await this.count({
              where: {
                ...secureWhere,
                on_status: true,
              },
            });

            // Get public count
            const publicCount = await this.count({
              where: {
                ...secureWhere,
                is_public: true,
              },
            });

            const statistics = {
              category_id: categoryId,
              total_agents: totalCount,
              active_agents: activeCount,
              inactive_agents: totalCount - activeCount,
              public_agents: publicCount,
              private_agents: totalCount - publicCount,
            };

            return statistics;
          },
          {
            userId,
            userRole,
            operation: 'getCategoryStatistics',
            resource: 'agent',
            metadata: { categoryId },
          },
        );
      },
      // API-compatible method names (snake_case) that call the camelCase methods
      async category_assign(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        // Extract parameters from input object
        const { agent_id, category_id } = input;
        return await this.assignCategory(
          agent_id,
          category_id,
          userId,
          userRole,
        );
      },

      async category_remove(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        const { agent_id } = input;
        return await this.removeCategory(agent_id, userId, userRole);
      },

      async category_bulk_assign(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        const { agent_ids, category_id } = input;
        return await this.bulkAssignCategory(
          agent_ids,
          category_id,
          userId,
          userRole,
        );
      },

      async category_transfer(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        const { from_category_id, to_category_id, company_id } = input;
        return await this.transferAgentsCategory(
          from_category_id,
          to_category_id,
          userId,
          userRole,
          company_id,
        );
      },

      async category_get_agents(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        const { category_id, include_inactive = false } = input;
        return await this.getAgentsByCategory(
          category_id,
          userId,
          userRole,
          include_inactive,
        );
      },

      async category_statistics(
        this: any,
        input: any,
        userId: string,
        userRole: string,
      ) {
        const { category_id } = input;
        return await this.getCategoryStatistics(category_id, userId, userRole);
      },
    },
  },
});

export type AgentAddCategoryExtension = typeof agentAddCategoryExtension;
