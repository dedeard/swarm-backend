import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for user role operations
export interface UpdateUserRoleInput {
  user_id: string;
  company_id: string;
  role_id?: string;
  role_name?: string;
}

export interface BulkUpdateUserRolesInput {
  company_id: string;
  updates: Array<{
    user_id: string;
    role_id?: string;
    role_name?: string;
  }>;
}

export interface RoleChangeResult {
  success: boolean;
  user_id: string;
  old_role?: any;
  new_role?: any;
  message?: string;
  error?: string;
}

// Enhanced Company User Role Extensions with Ultra-Simple RLS + Extension Architecture
export const userRoleExtension = Prisma.defineExtension({
  name: 'UserRoleExtension',
  model: {
    userCompany: {
      /**
       * Update user role in company
       */
      async updateUserRole(
        this: any,
        input: UpdateUserRoleInput,
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
          resource: 'company',
          resourceId: input.company_id,
          data: input,
        });

        // 2. Validate and process input
        const validatedInput = await this.validateAndProcessRoleUpdate(
          input,
          userRole,
          userId,
        );

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Get current membership
            const currentMembership = await this.findUnique({
              where: {
                user_id_company_id: {
                  user_id: validatedInput.user_id,
                  company_id: validatedInput.company_id,
                },
              },
              include: {
                role: true,
                company: true,
              },
            });

            if (!currentMembership) {
              throw new SecurityError('User is not a member of this company', {
                userId,
                targetUserId: validatedInput.user_id,
                companyId: validatedInput.company_id,
              });
            }

            // Check if role is actually changing
            if (currentMembership.role_id === validatedInput.role_id) {
              return {
                success: true,
                message: 'Role unchanged',
                current_membership: currentMembership,
              };
            }

            // Update the role
            const updatedMembership = await this.update({
              where: {
                user_id_company_id: {
                  user_id: validatedInput.user_id,
                  company_id: validatedInput.company_id,
                },
              },
              data: {
                role_id: validatedInput.role_id,
              },
              include: {
                role: true,
                company: true,
              },
            });

            return {
              success: true,
              message: 'Role updated successfully',
              old_role: currentMembership.role,
              new_role: updatedMembership.role,
              updated_membership: updatedMembership,
            };
          },
          {
            userId,
            userRole,
            operation: 'updateUserRole',
            resource: 'company',
            resourceId: input.company_id,
            metadata: {
              targetUserId: input.user_id,
              newRoleId: validatedInput.role_id,
            },
          },
        );
      },

      /**
       * Bulk update user roles in company
       */
      async bulkUpdateUserRoles(
        this: any,
        input: BulkUpdateUserRolesInput,
        userId: string,
        userRole: string,
      ): Promise<RoleChangeResult[]> {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // 1. Validate permissions
        await PermissionValidator.validate({
          userId,
          userRole,
          operation: 'update',
          resource: 'company',
          resourceId: input.company_id,
          data: { count: input.updates.length },
        });

        // 2. Validate bulk operation permission
        if (userRole !== 'swarm_admin') {
          const isCompanyAdmin = await DatabaseHelper.isCompanyAdmin(
            userId,
            input.company_id,
          );
          if (!isCompanyAdmin) {
            throw new SecurityError(
              'Bulk role updates require company admin privileges',
              {
                userId,
                userRole,
                companyId: input.company_id,
              },
            );
          }
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            const results: RoleChangeResult[] = [];

            for (const update of input.updates) {
              try {
                const updateInput: UpdateUserRoleInput = {
                  user_id: update.user_id,
                  company_id: input.company_id,
                  role_id: update.role_id,
                  role_name: update.role_name,
                };

                const result = await this.updateUserRole(
                  updateInput,
                  userId,
                  userRole,
                );
                results.push({
                  success: true,
                  user_id: update.user_id,
                  old_role: result.old_role,
                  new_role: result.new_role,
                  message: result.message,
                });
              } catch (error) {
                results.push({
                  success: false,
                  user_id: update.user_id,
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
            operation: 'bulkUpdateUserRoles',
            resource: 'company',
            resourceId: input.company_id,
            metadata: { updateCount: input.updates.length },
          },
        );
      },

      /**
       * Promote user to admin role
       */
      async promoteUserToAdmin(
        this: any,
        targetUserId: string,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Get admin role
        const adminRole = await DatabaseHelper.getRoleByName('company_admin');
        if (!adminRole) {
          throw new SecurityError('Admin role not found', {
            userId,
            companyId,
          });
        }

        return await this.updateUserRole(
          {
            user_id: targetUserId,
            company_id: companyId,
            role_id: adminRole.role_id,
          },
          userId,
          userRole,
        );
      },

      /**
       * Demote user from admin role
       */
      async demoteUserFromAdmin(
        this: any,
        targetUserId: string,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Get regular user role
        const userRoleObj = await DatabaseHelper.getRoleByName('swarm_user');
        if (!userRoleObj) {
          throw new SecurityError('User role not found', {
            userId,
            companyId,
          });
        }

        // Additional validation for admin demotion
        await this.validateAdminDemotion(
          targetUserId,
          companyId,
          userId,
          userRole,
        );

        return await this.updateUserRole(
          {
            user_id: targetUserId,
            company_id: companyId,
            role_id: userRoleObj.role_id,
          },
          userId,
          userRole,
        );
      },

      /**
       * Get user roles in company
       */
      async getUserRoleInCompany(
        this: any,
        targetUserId: string,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate access
        const hasAccess = await this.validateRoleViewAccess(
          companyId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to view user roles in this company',
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
            const membership = await this.findUnique({
              where: {
                user_id_company_id: {
                  user_id: targetUserId,
                  company_id: companyId,
                },
              },
              include: {
                role: true,
                company: {
                  select: {
                    company_id: true,
                    name: true,
                  },
                },
              },
            });

            return membership;
          },
          {
            userId,
            userRole,
            operation: 'getUserRoleInCompany',
            resource: 'company',
            resourceId: companyId,
            metadata: { targetUserId },
          },
        );
      },

      /**
       * Get all user roles across companies
       */
      async getUserRolesAcrossCompanies(
        this: any,
        targetUserId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate access (can view own roles or admin can view others)
        if (targetUserId !== userId && userRole !== 'swarm_admin') {
          throw new SecurityError(
            'Cannot view other users roles across companies',
            {
              userId,
              userRole,
              targetUserId,
            },
          );
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            const memberships = await this.findMany({
              where: {
                user_id: targetUserId,
              },
              include: {
                role: true,
                company: {
                  select: {
                    company_id: true,
                    name: true,
                    industry: true,
                  },
                },
              },
              orderBy: {
                company: {
                  name: 'asc',
                },
              },
            });

            return memberships;
          },
          {
            userId,
            userRole,
            operation: 'getUserRolesAcrossCompanies',
            resource: 'company',
            metadata: { targetUserId },
          },
        );
      },

      // Helper methods
      async validateAndProcessRoleUpdate(
        input: UpdateUserRoleInput,
        userRole: string,
        userId: string,
      ): Promise<UpdateUserRoleInput> {
        const processed = { ...input };

        // Resolve role_name to role_id if provided
        if (processed.role_name && !processed.role_id) {
          const role = await DatabaseHelper.getRoleByName(processed.role_name);
          if (!role) {
            throw new SecurityError(`Role '${processed.role_name}' not found`, {
              userId,
              roleName: processed.role_name,
            });
          }
          processed.role_id = role.role_id;
        }

        if (!processed.role_id) {
          throw new SecurityError('Role ID or role name must be provided', {
            userId,
            input,
          });
        }

        // Validate access based on role
        const hasAccess = await this.validateRoleUpdateAccess(
          processed.company_id,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to update user roles in this company',
            {
              userId,
              userRole,
              companyId: processed.company_id,
            },
          );
        }

        // Additional validation for role changes
        await this.validateRoleChange(processed, userRole, userId);

        return processed;
      },

      async validateRoleChange(
        processed: any,
        userRole: string,
        userId: string,
      ): Promise<void> {
        // Additional validation logic for role changes
        // This method can be extended with specific business rules
        console.log(
          `[AUDIT] Role change validation for user ${userId} with role ${userRole}`,
        );
      },

      async validateRoleUpdateAccess(
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        switch (userRole) {
          case 'swarm_admin':
            // Validate function permission for specific role changes
            const hasPermission = await DatabaseHelper.hasPermission(
              userId,
              'company:update',
            );
            if (!hasPermission) {
              throw new SecurityError('Missing company:update permission', {
                userId,
                requiredPermission: 'company:update',
              });
            }
            return true;
          default:
            return false;
        }
      },

      async validateAdminDemotion(
        targetUserId: string,
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<void> {
        // Check if target user is currently an admin
        const isTargetAdmin = await DatabaseHelper.isCompanyAdmin(
          targetUserId,
          companyId,
        );
        if (!isTargetAdmin) {
          throw new SecurityError('Target user is not currently an admin', {
            userId,
            targetUserId,
            companyId,
          });
        }

        // Check if there will be at least one admin left
        const adminCount = await DatabaseHelper.prismaClient.$executeRaw`
          SELECT COUNT(*) as count FROM "swarm-company".user_companies uc
          JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
          WHERE uc.company_id = ${companyId}::UUID 
          AND r.role_name IN ('company_admin', 'owner')
        `;
        const totalAdmins =
          Array.isArray(adminCount) && adminCount.length > 0
            ? Number((adminCount[0] as any).count)
            : 0;

        if (totalAdmins <= 1) {
          throw new SecurityError(
            'Cannot demote the last admin - company must have at least one admin',
            {
              userId,
              targetUserId,
              companyId,
            },
          );
        }
      },

      /**
       * Check if user can update roles in company
       */
      async canUpdateUserRoles(
        this: any,
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        try {
          return await this.validateRoleUpdateAccess(
            companyId,
            userId,
            userRole,
          );
        } catch (error) {
          return false;
        }
      },

      /**
       * Get available roles for assignment
       */
      async getAvailableRoles(
        this: any,
        companyId: string,
        userId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Validate access
        const hasAccess = await this.validateRoleViewAccess(
          companyId,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError('Access denied to view available roles', {
            userId,
            userRole,
            companyId,
          });
        }

        return await ExtensionContext.execute(
          this,
          async () => {
            // Get all roles that can be assigned in companies
            const roles = await DatabaseHelper.prismaClient.$executeRaw`
              SELECT role_id, role_name, description 
              FROM "swarm-rbac".roles 
              WHERE role_name IN ('swarm_user', 'company_admin', 'swarm_company_admin')
              ORDER BY role_name
            `;

            return Array.isArray(roles) ? roles : [];
          },
          {
            userId,
            userRole,
            operation: 'getAvailableRoles',
            resource: 'company',
            resourceId: companyId,
          },
        );
      },
    },
  },
});

export type UserRoleExtension = typeof userRoleExtension;
