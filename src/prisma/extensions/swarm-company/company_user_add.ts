import { Prisma } from '@prisma/client';
import { ExtensionContext } from '../../shared/admin-context';
import { DatabaseHelper } from '../../shared/database-helper';
import {
  PermissionValidator,
  SecurityError,
} from '../../shared/permission-validator';

// Type definitions for user-company operations
export interface AddUserToCompanyInput {
  user_id: string;
  company_id: string;
  role_id?: string;
  role_name?: string;
}

export interface BulkAddUsersInput {
  company_id: string;
  users: Array<{
    user_id: string;
    role_id?: string;
    role_name?: string;
  }>;
}

export interface InviteUserToCompanyInput {
  email: string;
  company_id: string;
  role_id?: string;
  role_name?: string;
  invitation_message?: string;
}

export type BulkAddUserResult =
  | {
      success: true;
      user_id: string;
      membership: any;
    }
  | {
      success: false;
      user_id: string;
      error: string;
    };

// Enhanced Company User Add Extensions with Ultra-Simple RLS + Extension Architecture
export const addUserToCompanyExtension = Prisma.defineExtension({
  name: 'AddUserToCompanyExtension',
  model: {
    userCompany: {
      /**
       * Add user to company with role
       */
      async addUserToCompany(
        this: any,
        input: AddUserToCompanyInput,
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
          resource: 'company',
          resourceId: input.company_id,
          data: input,
        });

        // 2. Validate and process input
        const validatedInput = await this.validateAndProcessAddInput(
          input,
          userRole,
          userId,
        );

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // Check if user is already in company
            const existingMembership = await this.findUnique({
              where: {
                user_id_company_id: {
                  user_id: validatedInput.user_id,
                  company_id: validatedInput.company_id,
                },
              },
            });

            if (existingMembership) {
              // Update existing membership if role is different
              if (
                validatedInput.role_id &&
                existingMembership.role_id !== validatedInput.role_id
              ) {
                return await this.update({
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
                    company: true,
                    role: true,
                  },
                });
              }
              return existingMembership;
            }

            // Create new membership
            const userCompany = await this.create({
              data: {
                user_id: validatedInput.user_id,
                company_id: validatedInput.company_id,
                role_id: validatedInput.role_id,
              },
              include: {
                company: true,
                role: true,
              },
            });

            return userCompany;
          },
          {
            userId,
            userRole,
            operation: 'addUserToCompany',
            resource: 'company',
            resourceId: input.company_id,
            metadata: {
              targetUserId: input.user_id,
              roleId: validatedInput.role_id,
            },
          },
        );
      },

      /**
       * Bulk add users to company
       */
      async bulkAddUsersToCompany(
        this: any,
        input: BulkAddUsersInput,
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
          resource: 'company',
          resourceId: input.company_id,
          data: { count: input.users.length },
        });

        // 2. Validate bulk operation permission
        if (userRole !== 'swarm_admin') {
          const isCompanyAdmin = await DatabaseHelper.isCompanyAdmin(
            userId,
            input.company_id,
          );
          if (!isCompanyAdmin) {
            throw new SecurityError(
              'Bulk user addition requires company admin privileges',
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
            const results: BulkAddUserResult[] = [];

            for (const userInput of input.users) {
              try {
                const addInput: AddUserToCompanyInput = {
                  user_id: userInput.user_id,
                  company_id: input.company_id,
                  role_id: userInput.role_id,
                  role_name: userInput.role_name,
                };

                const result = await this.addUserToCompany(
                  addInput,
                  userId,
                  userRole,
                );
                results.push({
                  success: true,
                  user_id: userInput.user_id,
                  membership: result,
                });
              } catch (error) {
                results.push({
                  success: false,
                  user_id: userInput.user_id,
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
            operation: 'bulkAddUsersToCompany',
            resource: 'company',
            resourceId: input.company_id,
            metadata: { userCount: input.users.length },
          },
        );
      },

      /**
       * Invite user to company by email
       */
      async inviteUserToCompany(
        this: any,
        input: InviteUserToCompanyInput,
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
          resource: 'company',
          resourceId: input.company_id,
          data: input,
        });

        // 2. Validate company admin access
        const hasAccess = await this.validateCompanyAccess(
          input.company_id,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to invite users to this company',
            {
              userId,
              userRole,
              companyId: input.company_id,
            },
          );
        }

        // 3. Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // In a real implementation, this would:
            // 1. Check if user exists by email
            // 2. Create invitation record
            // 3. Send invitation email
            // 4. Return invitation details

            // For now, we'll create a placeholder invitation
            const invitation = {
              invitation_id: `inv_${Date.now()}`,
              email: input.email,
              company_id: input.company_id,
              role_id: input.role_id,
              invited_by: userId,
              status: 'pending',
              created_at: new Date(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            };

            return invitation;
          },
          {
            userId,
            userRole,
            operation: 'inviteUserToCompany',
            resource: 'company',
            resourceId: input.company_id,
            metadata: {
              email: input.email,
              roleId: input.role_id,
            },
          },
        );
      },

      /**
       * Accept company invitation
       */
      async acceptCompanyInvitation(
        this: any,
        invitationId: string,
        acceptingUserId: string,
        userRole: string,
      ) {
        // Initialize DatabaseHelper with current Prisma client
        DatabaseHelper.setPrismaClient(this);

        // Execute with admin context
        return await ExtensionContext.execute(
          this,
          async () => {
            // In a real implementation, this would:
            // 1. Validate invitation exists and is not expired
            // 2. Check that accepting user's email matches invitation
            // 3. Add user to company with specified role
            // 4. Mark invitation as accepted
            // 5. Send confirmation

            // For now, we'll return a placeholder response
            return {
              success: true,
              message: 'Invitation accepted successfully',
              user_id: acceptingUserId,
              invitation_id: invitationId,
            };
          },
          {
            userId: acceptingUserId,
            userRole,
            operation: 'acceptCompanyInvitation',
            resource: 'company',
            metadata: { invitationId },
          },
        );
      },

      // Helper methods
      async validateAndProcessAddInput(
        input: AddUserToCompanyInput,
        userRole: string,
        userId: string,
      ): Promise<AddUserToCompanyInput> {
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

        // Set default role if none specified
        if (!processed.role_id) {
          const defaultRole = await DatabaseHelper.getRoleByName('swarm_user');
          if (defaultRole) {
            processed.role_id = defaultRole.role_id;
          }
        }

        // Validate access based on role
        const hasAccess = await this.validateCompanyAccess(
          processed.company_id,
          userId,
          userRole,
        );
        if (!hasAccess) {
          throw new SecurityError(
            'Access denied to add users to this company',
            {
              userId,
              userRole,
              companyId: processed.company_id,
            },
          );
        }

        // Validate target user exists (in a real implementation)
        // For now, we'll assume the user_id is valid

        return processed;
      },

      async validateCompanyAccess(
        companyId: string,
        userId: string,
        userRole: string,
      ): Promise<boolean> {
        switch (userRole) {
          case 'swarm_admin':
            return true;
          case 'swarm_company_admin':
            return await DatabaseHelper.isCompanyAdmin(userId, companyId);
          default:
            return false;
        }
      },
    },
  },
});
