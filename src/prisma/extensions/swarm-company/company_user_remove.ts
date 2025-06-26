import { Prisma } from '@prisma/client';
import { DatabaseHelper } from '../../shared/database-helper';

// Type definitions for user removal operations
export interface RemoveUserFromCompanyInput {
  user_id: string;
  company_id: string;
  reason?: string;
}

export interface BulkRemoveUsersInput {
  company_id: string;
  user_ids: string[];
  reason?: string;
}

export interface RemovalResult {
  success: boolean;
  user_id: string;
  message?: string;
  error?: string;
}

// Company User Remove Extensions
export const removeUserFromCompanyExtension = Prisma.defineExtension({
  name: 'RemoveUserFromCompanyExtension',
  model: {
    userCompany: {
      /**
       * Remove user from company
       */
      async removeUserFromCompany(
        this: any,
        input: RemoveUserFromCompanyInput,
        userId: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate removal is allowed
        await this.validateUserRemoval(input, userId);

        // Check if user is in company
        const membership = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: input.user_id,
              company_id: input.company_id,
            },
          },
          include: {
            company: true,
            role: true,
          },
        });

        if (!membership) {
          throw new Error('User is not a member of this company');
        }

        // Check for dependencies before removal
        const dependencies = await this.checkUserDependencies(
          input.user_id,
          input.company_id,
        );
        if (dependencies.hasBlockingDependencies) {
          throw new Error(`Cannot remove user: ${dependencies.message}`);
        }

        // Remove the user from company
        const removedMembership = await this.delete({
          where: {
            user_id_company_id: {
              user_id: input.user_id,
              company_id: input.company_id,
            },
          },
        });

        return {
          success: true,
          removed_membership: membership,
          reason: input.reason,
        };
      },

      /**
       * Bulk remove users from company
       */
      async bulkRemoveUsersFromCompany(
        this: any,
        input: BulkRemoveUsersInput,
        userId: string,
      ): Promise<RemovalResult[]> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate bulk removal permission
        const isCompanyAdmin = await DatabaseHelper.isCompanyAdmin(
          userId,
          input.company_id,
        );
        if (!isCompanyAdmin) {
          throw new Error(
            'Bulk user removal requires company admin privileges',
          );
        }

        const results: RemovalResult[] = [];

        for (const targetUserId of input.user_ids) {
          try {
            const removeInput: RemoveUserFromCompanyInput = {
              user_id: targetUserId,
              company_id: input.company_id,
              reason: input.reason,
            };

            await this.removeUserFromCompany(removeInput, userId);
            results.push({
              success: true,
              user_id: targetUserId,
              message: 'User removed successfully',
            });
          } catch (error) {
            results.push({
              success: false,
              user_id: targetUserId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return results;
      },

      /**
       * Leave company (self-removal)
       */
      async leaveCompany(this: any, companyId: string, userId: string) {
        // Users can always leave companies they are members of
        return await this.removeUserFromCompany(
          {
            user_id: userId,
            company_id: companyId,
            reason: 'User left company',
          },
          userId,
        );
      },

      /**
       * Transfer company ownership before leaving
       */
      async transferOwnershipAndLeave(
        this: any,
        companyId: string,
        newOwnerId: string,
        userId: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Check if current user is the owner
        const currentOwner = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: userId,
              company_id: companyId,
            },
          },
          include: {
            role: true,
          },
        });

        if (!currentOwner || currentOwner.role.role_name !== 'owner') {
          throw new Error('Only company owners can transfer ownership');
        }

        // Check if new owner exists and is a member
        const newOwner = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: newOwnerId,
              company_id: companyId,
            },
          },
        });

        if (!newOwner) {
          throw new Error('New owner is not a member of this company');
        }

        // Update ownership
        await this.updateMany({
          where: {
            company_id: companyId,
          },
          data: {
            role_id: null,
          },
        });

        // Set new owner
        await this.update({
          where: {
            user_id_company_id: {
              user_id: newOwnerId,
              company_id: companyId,
            },
          },
          data: {
            role_id: currentOwner.role_id,
          },
        });

        // Leave company
        return await this.leaveCompany(companyId, userId);
      },

      async validateRemovalAccess(
        companyId: string,
        userId: string,
      ): Promise<boolean> {
        // Check if user is company admin
        const isCompanyAdmin = await DatabaseHelper.isCompanyAdmin(
          userId,
          companyId,
        );
        return isCompanyAdmin;
      },

      async validateUserRemoval(
        this: any,
        input: RemoveUserFromCompanyInput,
        userId: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Check if user has permission to remove
        const hasPermission = await this.validateRemovalAccess(
          input.company_id,
          userId,
        );
        if (!hasPermission) {
          throw new Error('Insufficient permissions to remove user');
        }

        // Check if user is trying to remove themselves
        if (input.user_id === userId) {
          // Users can always remove themselves
          return;
        }

        // Check if target user is company owner
        const targetUser = await this.findUnique({
          where: {
            user_id_company_id: {
              user_id: input.user_id,
              company_id: input.company_id,
            },
          },
          include: {
            role: true,
          },
        });

        if (!targetUser) {
          throw new Error('Target user is not a member of this company');
        }

        if (targetUser.role.role_name === 'owner') {
          throw new Error('Cannot remove company owner');
        }
      },

      async checkUserDependencies(
        userId: string,
        companyId: string,
      ): Promise<{
        hasBlockingDependencies: boolean;
        message: string;
        details: any[];
      }> {
        // In a real implementation, this would check for:
        // - Active agents owned by the user
        // - Active tools owned by the user
        // - Active workflows owned by the user
        // - Other dependencies that would prevent removal

        // For now, return no blocking dependencies
        return {
          hasBlockingDependencies: false,
          message: 'No blocking dependencies found',
          details: [],
        };
      },
    },
  },
});
