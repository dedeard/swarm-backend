import { PrismaClient } from '@prisma/client';
import { ExtensionContext } from './admin-context';

export class DatabaseHelper {
  private static prisma: PrismaClient;

  static setPrismaClient(client: PrismaClient) {
    this.prisma = client;
  }

  static get prismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get the base Prisma client for raw queries
   */
  static get basePrismaClient(): PrismaClient {
    const baseClient = ExtensionContext.getBasePrismaClient();
    if (!baseClient) {
      throw new Error('Base Prisma client not available for raw queries');
    }
    return baseClient;
  }

  /**
   * Check if user is a member of the specified company
   */
  static async isUserInCompany(
    userId: string,
    companyId: string,
  ): Promise<boolean> {
    try {
      const userCompany = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-company".user_companies
        WHERE user_id = ${userId}::UUID
        AND company_id = ${companyId}::UUID
        LIMIT 1
      `;
      return Array.isArray(userCompany) && userCompany.length > 0;
    } catch (error) {
      console.error('Error checking user company membership:', error);
      return false;
    }
  }

  /**
   * Check if user is an admin of the specified company
   */
  static async isCompanyAdmin(
    userId: string,
    companyId: string,
  ): Promise<boolean> {
    try {
      const adminRole = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-company".user_companies uc
        JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
        WHERE uc.user_id = ${userId}::UUID
        AND uc.company_id = ${companyId}::UUID
        AND r.role_name IN ('admin', 'owner', 'swarm_company_admin')
        LIMIT 1
      `;
      return Array.isArray(adminRole) && adminRole.length > 0;
    } catch (error) {
      console.error('Error checking company admin status:', error);
      return false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(
    userId: string,
    permission: string,
  ): Promise<boolean> {
    try {
      // Use the base Prisma client from ExtensionContext if available, otherwise use the set client
      const basePrisma = ExtensionContext.getBasePrismaClient();
      const clientToUse = basePrisma || this.prisma;

      if (!clientToUse) {
        console.error('No Prisma client available for permission check');
        return false;
      }

      // Check if user has the specific permission
      const result: Array<{ count: bigint }> = await clientToUse.$queryRaw`
        SELECT COUNT(*) as count FROM "swarm-company".user_companies uc
        JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
        JOIN "swarm-rbac".role_function_permissions rfp ON r.role_id = rfp.role_id
        JOIN "swarm-rbac".function_permissions fp ON rfp.permission_id = fp.permission_id
        WHERE uc.user_id = ${userId}::UUID AND fp.function_name = ${permission}
      `;

      return result.length > 0 && result[0].count > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get the owner of an agent
   */
  static async getAgentOwner(
    agentId: string,
  ): Promise<{ user_id: string } | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT user_id FROM "swarm-agent".agents
        WHERE agent_id = ${agentId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0
        ? (result[0] as { user_id: string })
        : null;
    } catch (error) {
      console.error('Error getting agent owner:', error);
      return null;
    }
  }

  /**
   * Get the company of an agent
   */
  static async getAgentCompany(
    agentId: string,
  ): Promise<{ company_id: string | null; user_id: string } | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT company_id, user_id FROM "swarm-agent".agents
        WHERE agent_id = ${agentId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0
        ? (result[0] as { company_id: string | null; user_id: string })
        : null;
    } catch (error) {
      console.error('Error getting agent company:', error);
      return null;
    }
  }

  /**
   * Get companies where user is an admin
   */
  static async getUserAdminCompanies(userId: string): Promise<string[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT uc.company_id FROM "swarm-company".user_companies uc
        JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
        WHERE uc.user_id = ${userId}::UUID
        AND r.role_name IN ('admin', 'owner', 'swarm_company_admin')
      `;
      return Array.isArray(result)
        ? result.map((row: any) => row.company_id)
        : [];
    } catch (error) {
      console.error('Error getting user admin companies:', error);
      return [];
    }
  }

  /**
   * Get companies where user is a member (any role)
   */
  static async getUserCompanies(userId: string): Promise<string[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT company_id FROM "swarm-company".user_companies
        WHERE user_id = ${userId}::UUID
      `;
      return Array.isArray(result)
        ? result.map((row: any) => row.company_id)
        : [];
    } catch (error) {
      console.error('Error getting user companies:', error);
      return [];
    }
  }

  /**
   * Get user roles for a specific company
   */
  static async getUserRoles(
    userId: string,
    companyId?: string,
  ): Promise<string[]> {
    try {
      let query;
      if (companyId) {
        query = this.basePrismaClient.$queryRaw`
          SELECT r.role_name FROM "swarm-company".user_companies uc
          JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
          WHERE uc.user_id = ${userId}::UUID
          AND uc.company_id = ${companyId}::UUID
        `;
      } else {
        query = this.basePrismaClient.$queryRaw`
          SELECT DISTINCT r.role_name FROM "swarm-company".user_companies uc
          JOIN "swarm-rbac".roles r ON uc.role_id = r.role_id
          WHERE uc.user_id = ${userId}::UUID
        `;
      }

      const result = await query;
      return Array.isArray(result)
        ? result.map((row: any) => row.role_name)
        : [];
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Sync user roles with external system
   */
  static async syncUserRoles(userId: string, roles: string[]): Promise<void> {
    try {
      // This would typically sync with an external auth system
      // For now, we'll just log the operation
      console.log(`Syncing roles for user ${userId}:`, roles);
    } catch (error) {
      console.error('Error syncing user roles:', error);
      throw error;
    }
  }

  /**
   * Check if an agent can be accessed by a user
   */
  static async canAccessAgent(
    userId: string,
    agentId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const agent = await this.getAgentCompany(agentId);
      if (!agent) return false;

      // Owner can always access
      if (agent.user_id === userId) return true;

      // Check company membership if agent belongs to a company
      if (agent.company_id) {
        return await this.isUserInCompany(userId, agent.company_id);
      }

      // For public agents, check if agent is public
      const publicCheck = await this.basePrismaClient.$queryRaw`
        SELECT is_public FROM "swarm-agent".agents
        WHERE agent_id = ${agentId}::UUID AND is_public = true
        LIMIT 1
      `;
      return Array.isArray(publicCheck) && publicCheck.length > 0;
    } catch (error) {
      console.error('Error checking agent access:', error);
      return false;
    }
  }

  /**
   * Get public agents
   */
  static async getPublicAgents(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM agents 
        WHERE is_public = true
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting public agents:', error);
      return [];
    }
  }

  /**
   * Get agents by company
   */
  static async getAgentsByCompany(
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // First check if user has access to this company
      const hasAccess = await this.isUserInCompany(userId, companyId);
      if (!hasAccess) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM agents 
        WHERE company_id = ${companyId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting agents by company:', error);
      return [];
    }
  }

  /**
   * Check if company name already exists
   */
  static async checkCompanyNameExists(name: string): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-company".companies
        WHERE name = ${name}
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking company name existence:', error);
      return false;
    }
  }

  /**
   * Get company by ID
   */
  static async getCompanyById(companyId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-company".companies
        WHERE company_id = ${companyId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting company by ID:', error);
      return null;
    }
  }

  /**
   * Add user to company with role
   */
  static async addUserToCompany(
    userId: string,
    companyId: string,
    roleId?: string,
  ): Promise<void> {
    try {
      if (roleId) {
        await this.basePrismaClient.$executeRaw`
          INSERT INTO "swarm-company".user_companies (user_id, company_id, role_id)
          VALUES (${userId}::UUID, ${companyId}::UUID, ${roleId}::UUID)
          ON CONFLICT (user_id, company_id) DO UPDATE SET role_id = ${roleId}::UUID
        `;
      } else {
        await this.basePrismaClient.$executeRaw`
          INSERT INTO "swarm-company".user_companies (user_id, company_id)
          VALUES (${userId}::UUID, ${companyId}::UUID)
          ON CONFLICT (user_id, company_id) DO NOTHING
        `;
      }
    } catch (error) {
      console.error('Error adding user to company:', error);
      throw error;
    }
  }

  /**
   * Remove user from company
   */
  static async removeUserFromCompany(
    userId: string,
    companyId: string,
  ): Promise<void> {
    try {
      await this.basePrismaClient.$executeRaw`
        DELETE FROM "swarm-company".user_companies
        WHERE user_id = ${userId}::UUID AND company_id = ${companyId}::UUID
      `;
    } catch (error) {
      console.error('Error removing user from company:', error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(roleName: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-rbac".roles
        WHERE role_name = ${roleName}
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting role by name:', error);
      return null;
    }
  }

  /**
   * Check if component name already exists
   */
  static async checkComponentNameExists(name: string): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-component".components
        WHERE name = ${name}
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking component name existence:', error);
      return false;
    }
  }

  /**
   * Get component by ID
   */
  static async getComponentById(componentId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-component".components
        WHERE component_id = ${componentId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting component by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access component
   */
  static async canAccessComponent(
    userId: string,
    componentId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const component = await this.getComponentById(componentId);
      if (!component) return false;

      // Public components are accessible to all
      if (component.is_public) return true;

      // Check company membership if component belongs to a company
      if (component.company_id) {
        return await this.isUserInCompany(userId, component.company_id);
      }

      // For admin roles, check permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'component:read');
      }

      return false;
    } catch (error) {
      console.error('Error checking component access:', error);
      return false;
    }
  }

  /**
   * Get components by company
   */
  static async getComponentsByCompany(
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // First check if user has access to this company
      const hasAccess = await this.isUserInCompany(userId, companyId);
      if (!hasAccess) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-component".components
        WHERE company_id = ${companyId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting components by company:', error);
      return [];
    }
  }

  /**
   * Get public components
   */
  static async getPublicComponents(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-component".components
        WHERE is_public = true AND is_active = true
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting public components:', error);
      return [];
    }
  }

  /**
   * Get all users in specified companies
   */
  static async getUsersInCompanies(companyIds: string[]): Promise<string[]> {
    try {
      if (companyIds.length === 0) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT DISTINCT user_id FROM "swarm-company".user_companies
        WHERE company_id = ANY(${companyIds}::UUID[])
      `;
      return Array.isArray(result) ? result.map((row: any) => row.user_id) : [];
    } catch (error) {
      console.error('Error getting users in companies:', error);
      return [];
    }
  }

  /**
   * Check if user profile exists
   */
  static async checkUserProfileExists(userId: string): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-user".user_profiles
        WHERE user_id = ${userId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking user profile existence:', error);
      return false;
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfileById(userId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-user".user_profiles
        WHERE user_id = ${userId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user profile by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access another user's profile
   */
  static async canAccessUserProfile(
    userId: string,
    targetUserId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      // Users can always access their own profile
      if (userId === targetUserId) return true;

      // Admin roles can access any profile with proper permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'user:read');
      }

      // Company admins can access profiles of users in their companies
      if (userRole === 'swarm_company_admin') {
        const adminCompanies = await this.getUserAdminCompanies(userId);
        const targetUserCompanies = await this.getUserCompanies(targetUserId);
        return adminCompanies.some((companyId) =>
          targetUserCompanies.includes(companyId),
        );
      }

      return false;
    } catch (error) {
      console.error('Error checking user profile access:', error);
      return false;
    }
  }

  /**
   * Check if organization name already exists for a user
   */
  static async checkOrganizationNameExists(
    organizationName: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-organization".organizations
        WHERE organization_name = ${organizationName} AND user_id = ${userId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking organization name existence:', error);
      return false;
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(
    organizationId: string,
  ): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-organization".organizations
        WHERE organization_id = ${organizationId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting organization by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access organization
   */
  static async canAccessOrganization(
    userId: string,
    organizationId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const organization = await this.getOrganizationById(organizationId);
      if (!organization) return false;

      // Public organizations are accessible to all
      if (organization.is_public) return true;

      // Own organizations are accessible
      if (organization.user_id === userId) return true;

      // Check company membership if organization belongs to a company
      if (organization.company_id) {
        return await this.isUserInCompany(userId, organization.company_id);
      }

      // For admin roles, check permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'organization:read');
      }

      return false;
    } catch (error) {
      console.error('Error checking organization access:', error);
      return false;
    }
  }

  /**
   * Get organizations by user
   */
  static async getOrganizationsByUser(userId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-organization".organizations
        WHERE user_id = ${userId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting organizations by user:', error);
      return [];
    }
  }

  /**
   * Get organizations by company
   */
  static async getOrganizationsByCompany(
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // First check if user has access to this company
      const hasAccess = await this.isUserInCompany(userId, companyId);
      if (!hasAccess) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-organization".organizations
        WHERE company_id = ${companyId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting organizations by company:', error);
      return [];
    }
  }

  /**
   * Get public organizations
   */
  static async getPublicOrganizations(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-organization".organizations
        WHERE is_public = true
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting public organizations:', error);
      return [];
    }
  }

  /**
   * Check if team name already exists for a user
   */
  static async checkTeamNameExists(
    teamName: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-team".teams
        WHERE team_name = ${teamName} AND user_id = ${userId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking team name existence:', error);
      return false;
    }
  }

  /**
   * Get team by ID
   */
  static async getTeamById(teamId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-team".teams
        WHERE team_id = ${teamId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting team by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access team
   */
  static async canAccessTeam(
    userId: string,
    teamId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) return false;

      // Public teams are accessible to all
      if (team.is_public) return true;

      // Own teams are accessible
      if (team.user_id === userId) return true;

      // Check company membership if team belongs to a company
      if (team.company_id) {
        return await this.isUserInCompany(userId, team.company_id);
      }

      // For admin roles, check permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'team:read');
      }

      return false;
    } catch (error) {
      console.error('Error checking team access:', error);
      return false;
    }
  }

  /**
   * Get teams by user
   */
  static async getTeamsByUser(userId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-team".teams
        WHERE user_id = ${userId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting teams by user:', error);
      return [];
    }
  }

  /**
   * Get teams by company
   */
  static async getTeamsByCompany(
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // First check if user has access to this company
      const hasAccess = await this.isUserInCompany(userId, companyId);
      if (!hasAccess) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-team".teams
        WHERE company_id = ${companyId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting teams by company:', error);
      return [];
    }
  }

  /**
   * Get public teams
   */
  static async getPublicTeams(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-team".teams
        WHERE is_public = true
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting public teams:', error);
      return [];
    }
  }

  /**
   * Add agent to team
   */
  static async addAgentToTeam(
    teamId: string,
    agentId: string,
  ): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        INSERT INTO "swarm-team".team_members (team_id, agent_id, added_at)
        VALUES (${teamId}::UUID, ${agentId}::UUID, NOW())
        ON CONFLICT (team_id, agent_id) DO NOTHING
      `;
      return true;
    } catch (error) {
      console.error('Error adding agent to team:', error);
      return false;
    }
  }

  /**
   * Remove agent from team
   */
  static async removeAgentFromTeam(
    teamId: string,
    agentId: string,
  ): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        DELETE FROM "swarm-team".team_members
        WHERE team_id = ${teamId}::UUID AND agent_id = ${agentId}::UUID
      `;
      return true;
    } catch (error) {
      console.error('Error removing agent from team:', error);
      return false;
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT tm.*, a.agent_name, a.description, a.user_id as agent_owner_id
        FROM "swarm-team".team_members tm
        JOIN "swarm-agent".agents a ON tm.agent_id = a.agent_id
        WHERE tm.team_id = ${teamId}::UUID
        ORDER BY tm.added_at ASC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  /**
   * Check if agent is in team
   */
  static async isAgentInTeam(
    teamId: string,
    agentId: string,
  ): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-team".team_members
        WHERE team_id = ${teamId}::UUID AND agent_id = ${agentId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking if agent is in team:', error);
      return false;
    }
  }

  /**
   * Get agent by ID
   */
  static async getAgentById(agentId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-agent".agents
        WHERE agent_id = ${agentId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting agent by ID:', error);
      return null;
    }
  }

  /**
   * Check if llmstxt name already exists for a user
   */
  static async checkLlmstxtNameExists(
    name: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-llmstxt".llmstxt_registry
        WHERE name = ${name} AND user_id = ${userId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking llmstxt name existence:', error);
      return false;
    }
  }

  /**
   * Get llmstxt entry by ID
   */
  static async getLlmstxtById(llmstxtId: string): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-llmstxt".llmstxt_registry
        WHERE llmstxt_id = ${llmstxtId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting llmstxt by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access llmstxt entry
   */
  static async canAccessLlmstxt(
    userId: string,
    llmstxtId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const llmstxt = await this.getLlmstxtById(llmstxtId);
      if (!llmstxt) return false;

      // Public and active entries are accessible to all
      if (llmstxt.is_public && llmstxt.is_active) return true;

      // Own entries are accessible
      if (llmstxt.user_id === userId) return true;

      // Check company membership if entry belongs to a company
      if (llmstxt.company_id) {
        return await this.isUserInCompany(userId, llmstxt.company_id);
      }

      // For admin roles, check permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'llmstxt:read');
      }

      return false;
    } catch (error) {
      console.error('Error checking llmstxt access:', error);
      return false;
    }
  }

  /**
   * Get llmstxt entries by user
   */
  static async getLlmstxtByUser(userId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-llmstxt".llmstxt_registry
        WHERE user_id = ${userId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting llmstxt by user:', error);
      return [];
    }
  }

  /**
   * Get llmstxt entries by company
   */
  static async getLlmstxtByCompany(
    companyId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // First check if user has access to this company
      const hasAccess = await this.isUserInCompany(userId, companyId);
      if (!hasAccess) return [];

      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-llmstxt".llmstxt_registry
        WHERE company_id = ${companyId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting llmstxt by company:', error);
      return [];
    }
  }

  /**
   * Get public llmstxt entries
   */
  static async getPublicLlmstxt(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-llmstxt".llmstxt_registry
        WHERE is_public = true AND is_active = true
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting public llmstxt:', error);
      return [];
    }
  }

  /**
   * Add llmstxt to agent
   */
  static async addLlmstxtToAgent(
    agentId: string,
    llmstxtId: string,
    priority: number = 0,
    isRequired: boolean = false,
    usageType: string = 'context',
  ): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        INSERT INTO "swarm-llmstxt".llmstxt (agent_id, llmstxt_id, priority, is_required, usage_type, metadata, created_at, updated_at)
        VALUES (${agentId}::UUID, ${llmstxtId}::UUID, ${priority}, ${isRequired}, ${usageType}, '{}', NOW(), NOW())
        ON CONFLICT (agent_id, llmstxt_id) DO UPDATE SET
          priority = ${priority},
          is_required = ${isRequired},
          usage_type = ${usageType},
          updated_at = NOW()
      `;
      return true;
    } catch (error) {
      console.error('Error adding llmstxt to agent:', error);
      return false;
    }
  }

  /**
   * Remove llmstxt from agent
   */
  static async removeLlmstxtFromAgent(
    agentId: string,
    llmstxtId: string,
  ): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        DELETE FROM "swarm-llmstxt".llmstxt
        WHERE agent_id = ${agentId}::UUID AND llmstxt_id = ${llmstxtId}::UUID
      `;
      return true;
    } catch (error) {
      console.error('Error removing llmstxt from agent:', error);
      return false;
    }
  }

  /**
   * Get agent llmstxt associations
   */
  static async getAgentLlmstxt(agentId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT al.*, lr.name, lr.description, lr.type, lr.relative_url
        FROM "swarm-llmstxt".llmstxt al
        JOIN "swarm-llmstxt".llmstxt_registry lr ON al.llmstxt_id = lr.llmstxt_id
        WHERE al.agent_id = ${agentId}::UUID
        ORDER BY al.priority DESC, al.created_at ASC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting agent llmstxt:', error);
      return [];
    }
  }

  /**
   * Check if llmstxt is associated with agent
   */
  static async isLlmstxtAssociatedWithAgent(
    agentId: string,
    llmstxtId: string,
  ): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-llmstxt".llmstxt
        WHERE agent_id = ${agentId}::UUID AND llmstxt_id = ${llmstxtId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking llmstxt agent association:', error);
      return false;
    }
  }

  /**
   * Check if waitlist email already exists
   */
  static async checkWaitlistEmailExists(email: string): Promise<boolean> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT 1 FROM "swarm-waitlist".waitlist_entries
        WHERE email = ${email}
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error checking waitlist email existence:', error);
      return false;
    }
  }

  /**
   * Create waitlist position history entry
   */
  static async createWaitlistPositionHistory(data: {
    waitlist_entry_id: string;
    old_position: number | null;
    new_position: number;
    total_count: number;
    change_reason: string;
    admin_user_id?: string;
  }): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        INSERT INTO "swarm-waitlist".waitlist_position_history
        (waitlist_entry_id, old_position, new_position, total_count, change_reason, admin_user_id, created_at)
        VALUES (
          ${data.waitlist_entry_id}::UUID,
          ${data.old_position},
          ${data.new_position},
          ${data.total_count},
          ${data.change_reason},
          ${data.admin_user_id ? `${data.admin_user_id}::UUID` : null},
          NOW()
        )
      `;
      return true;
    } catch (error) {
      console.error('Error creating waitlist position history:', error);
      return false;
    }
  }

  /**
   * Get waitlist entry by ID
   */
  static async getWaitlistEntryById(
    waitlistEntryId: string,
  ): Promise<any | null> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-waitlist".waitlist_entries
        WHERE waitlist_entry_id = ${waitlistEntryId}::UUID
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting waitlist entry by ID:', error);
      return null;
    }
  }

  /**
   * Check if user can access waitlist entry
   */
  static async canAccessWaitlistEntry(
    userId: string,
    waitlistEntryId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const entry = await this.getWaitlistEntryById(waitlistEntryId);
      if (!entry) return false;

      // Users can only access their own entries
      if (userRole === 'swarm_user') {
        return entry.user_id === userId;
      }

      // For admin roles, check permissions
      if (userRole === 'swarm_admin') {
        return await this.hasPermission(userId, 'waitlist:read');
      }

      return false;
    } catch (error) {
      console.error('Error checking waitlist entry access:', error);
      return false;
    }
  }

  /**
   * Get waitlist entries by user
   */
  static async getWaitlistEntriesByUser(userId: string): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT * FROM "swarm-waitlist".waitlist_entries
        WHERE user_id = ${userId}::UUID
        ORDER BY created_at DESC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting waitlist entries by user:', error);
      return [];
    }
  }

  /**
   * Get waitlist statistics
   */
  static async getWaitlistStatistics(): Promise<any> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT
          COUNT(*) as total_entries,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_entries,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_entries,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_entries,
          AVG(priority_score) as avg_priority_score,
          MAX(position) as max_position
        FROM "swarm-waitlist".waitlist_entries
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : {};
    } catch (error) {
      console.error('Error getting waitlist statistics:', error);
      return {};
    }
  }

  /**
   * Get maximum waitlist position
   */
  static async getMaxWaitlistPosition(): Promise<number> {
    try {
      const result: Array<{ max_position: number | null }> = await this
        .basePrismaClient.$queryRaw`
        SELECT MAX(position) as max_position
        FROM "swarm-waitlist".waitlist_entries
        WHERE status IN ('PENDING', 'INVITED')
      `;

      const maxPosition =
        result.length > 0 && result[0].max_position
          ? result[0].max_position
          : 0;
      return maxPosition || 0;
    } catch (error) {
      console.error('Error getting max waitlist position:', error);
      return 0;
    }
  }

  /**
   * Get waitlist entry count
   */
  static async getWaitlistEntryCount(): Promise<number> {
    try {
      const result: Array<{ total_count: bigint }> = await this.basePrismaClient
        .$queryRaw`
        SELECT COUNT(*) as total_count
        FROM "swarm-waitlist".waitlist_entries
        WHERE status IN ('PENDING', 'INVITED')
      `;

      const totalCount = result.length > 0 ? Number(result[0].total_count) : 0;
      return totalCount;
    } catch (error) {
      console.error('Error getting waitlist entry count:', error);
      return 0;
    }
  }

  /**
   * Update waitlist positions after approval
   */
  static async updateWaitlistPositionsAfterApproval(
    approvedEntryId: string,
  ): Promise<any[]> {
    try {
      // Get the approved entry's position
      const approvedResult: Array<{ position: number }> = await this
        .basePrismaClient.$queryRaw`
        SELECT position FROM "swarm-waitlist".waitlist_entries
        WHERE waitlist_entry_id = ${approvedEntryId}::UUID
      `;

      if (!Array.isArray(approvedResult) || approvedResult.length === 0)
        return [];
      const approvedPosition = approvedResult[0].position;

      // Get entries to update
      const entriesToUpdate = await this.basePrismaClient.$queryRaw`
        SELECT waitlist_entry_id, position
        FROM "swarm-waitlist".waitlist_entries
        WHERE position > ${approvedPosition}
        AND status IN ('PENDING', 'INVITED')
        ORDER BY position ASC
      `;

      return Array.isArray(entriesToUpdate) ? entriesToUpdate : [];
    } catch (error) {
      console.error('Error getting entries to update after approval:', error);
      return [];
    }
  }

  /**
   * Update single waitlist entry position
   */
  static async updateWaitlistEntryPosition(
    entryId: string,
    newPosition: number,
  ): Promise<boolean> {
    try {
      await this.basePrismaClient.$executeRaw`
        UPDATE "swarm-waitlist".waitlist_entries
        SET position = ${newPosition},
            total_users_ahead = ${Math.max(0, newPosition - 1)},
            updated_at = NOW()
        WHERE waitlist_entry_id = ${entryId}::UUID
      `;
      return true;
    } catch (error) {
      console.error('Error updating waitlist entry position:', error);
      return false;
    }
  }

  /**
   * Get maximum waitlist question display order
   */
  static async getMaxWaitlistQuestionOrder(): Promise<number> {
    try {
      const result: Array<{ max_order: number | null }> = await this
        .basePrismaClient.$queryRaw`
        SELECT MAX(display_order) as max_order
        FROM "swarm-waitlist".waitlist_questions
      `;

      const maxOrder =
        result.length > 0 && result[0].max_order ? result[0].max_order : 0;
      return maxOrder || 0;
    } catch (error) {
      console.error('Error getting max waitlist question order:', error);
      return 0;
    }
  }

  /**
   * Get maximum question option display order
   */
  static async getMaxQuestionOptionOrder(questionId: string): Promise<number> {
    try {
      const result: Array<{ max_order: number | null }> = await this
        .basePrismaClient.$queryRaw`
        SELECT MAX(display_order) as max_order
        FROM "swarm-waitlist".waitlist_question_options
        WHERE question_id = ${questionId}::UUID
      `;

      const maxOrder =
        result.length > 0 && result[0].max_order ? result[0].max_order : 0;
      return maxOrder || 0;
    } catch (error) {
      console.error('Error getting max question option order:', error);
      return 0;
    }
  }

  /**
   * Get active required waitlist questions
   */
  static async getActiveRequiredWaitlistQuestions(): Promise<any[]> {
    try {
      const result = await this.basePrismaClient.$queryRaw`
        SELECT question_id, question_text, question_type, display_order
        FROM "swarm-waitlist".waitlist_questions
        WHERE is_active = true AND is_required = true
        ORDER BY display_order ASC
      `;

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting active required waitlist questions:', error);
      return [];
    }
  }
}
