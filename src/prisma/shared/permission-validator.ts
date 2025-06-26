import { DatabaseHelper } from './database-helper'

export interface SecurityContext {
  userId: string
  userRole: string
  companyId?: string
  operation: 'create' | 'read' | 'update' | 'delete'
  resource: string
  resourceId?: string
  data?: any
}

export class PermissionValidator {
  private static readonly ROLE_HIERARCHY = {
    swarm_admin: 800,
    swarm_company_admin: 600,
    swarm_user: 400,
    swarm_public: 200,
  } as const

  /**
   * Main permission validation entry point
   */
  static async validate(context: SecurityContext): Promise<void> {
    // Re-enable permission validation for proper security
    const validator = this.getResourceValidator(context.resource)
    const isAllowed = await validator(context)

    if (!isAllowed) {
      throw new SecurityError(`Access denied: ${context.userRole} cannot ${context.operation} ${context.resource}`, context)
    }

    console.log(`[PermissionValidator] Allowed ${context.userRole} to ${context.operation} ${context.resource}`)
  }

  private static getResourceValidator(resource: string): (context: SecurityContext) => Promise<boolean> {
    const validators = {
      agent: this.validateAgentAccess.bind(this),
      agent_log: this.validateAgentLogAccess.bind(this),
      company: this.validateCompanyAccess.bind(this),
      component: this.validateComponentAccess.bind(this),
      llmstxt: this.validateLlmstxtAccess.bind(this),
      organization: this.validateOrganizationAccess.bind(this),
      team: this.validateTeamAccess.bind(this),
      user: this.validateUserAccess.bind(this),
      tool: this.validateToolAccess.bind(this),
      waitlist: this.validateWaitlistAccess.bind(this),
      workflow: this.validateWorkflowAccess.bind(this),
    }

    const validator = validators[resource as keyof typeof validators]
    if (!validator) {
      throw new Error(`No validator found for resource: ${resource}`)
    }

    return validator
  }

  private static async validateAgentAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserAgentAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminAgentAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminAgentAccess(context)
      case 'swarm_public':
        // Only read access to public agents
        return operation === 'read' && (data?.is_public === true || !data)
      default:
        return false
    }
  }

  private static async validateSwarmUserAgentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create own agents or public agents
        if (data?.company_id) {
          return await DatabaseHelper.isUserInCompany(userId, data.company_id)
        }
        return true // Can create personal/public agents

      case 'read':
        // Can read own agents and public agents (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify own agents
        if (resourceId) {
          const agent = await DatabaseHelper.getAgentOwner(resourceId)
          return agent?.user_id === userId
        }
        return data?.user_id === userId

      default:
        return false
    }
  }

  private static async validateCompanyAdminAgentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create agents for managed companies
        if (data?.company_id) {
          return await DatabaseHelper.isCompanyAdmin(userId, data.company_id)
        }
        return true // Can create public agents

      case 'read':
        // Can read company agents and public agents (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify agents in managed companies
        if (resourceId) {
          const agent = await DatabaseHelper.getAgentCompany(resourceId)
          if (agent?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, agent.company_id)
          }
          return agent?.user_id === userId // Own agents
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminAgentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'agent:create',
      read: 'agent:read',
      update: 'agent:update',
      delete: 'agent:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateAgentLogAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserAgentLogAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminAgentLogAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminAgentLogAccess(context)
      case 'swarm_public':
        // No access to agent logs for public users
        return false
      default:
        return false
    }
  }

  private static async validateSwarmUserAgentLogAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // For log creation, we'll do a basic permission check here
        // The actual agent existence and access validation will be done in the extension
        // This allows for better error handling and more specific error messages
        if (data?.agent_id) {
          // Basic validation: swarm_user can attempt to create logs
          // Detailed validation happens in the extension with better error handling
          return true
        }
        return false

      case 'read':
        // Can read logs for agents they have access to (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify logs for agents they own
        if (data?.agent_id) {
          const agent = await DatabaseHelper.getAgentOwner(data.agent_id)
          return agent?.user_id === userId
        }
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminAgentLogAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create logs for agents in managed companies
        if (data?.agent_id) {
          return await DatabaseHelper.canAccessAgent(userId, data.agent_id, 'swarm_company_admin')
        }
        return false

      case 'read':
        // Can read logs for company agents (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify logs for agents in managed companies
        if (data?.agent_id) {
          const agent = await DatabaseHelper.getAgentCompany(data.agent_id)
          if (agent?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, agent.company_id)
          }
          return agent?.user_id === userId // Own agents
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminAgentLogAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'agent_log:create',
      read: 'agent_log:read',
      update: 'agent_log:update',
      delete: 'agent_log:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateCompanyAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserCompanyAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminCompanyAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminCompanyAccess(context)
      case 'swarm_public':
        // No access to companies for public users
        return false
      default:
        return false
    }
  }

  private static async validateSwarmUserCompanyAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Users can create companies
        return true

      case 'read':
        // Can read companies they are members of (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Users cannot update or delete companies
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminCompanyAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Company admins can create companies
        return true

      case 'read':
        // Can read companies they are members of (filtering handled in extension)
        return true

      case 'update':
        // Can update companies they admin (validated in extension)
        return true

      case 'delete':
        // Company admins cannot delete companies
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminCompanyAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'company:create',
      read: 'company:read',
      update: 'company:update',
      delete: 'company:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateUserAccess(context: SecurityContext): Promise<boolean> {
    // Placeholder for user access validation
    return true
  }

  private static async validateComponentAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserComponentAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminComponentAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminComponentAccess(context)
      case 'swarm_public':
        // Only read access to public components
        return operation === 'read' && (data?.is_public === true || !data)
      default:
        return false
    }
  }

  private static async validateSwarmUserComponentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create components for companies they're members of
        if (data?.company_id) {
          return await DatabaseHelper.isUserInCompany(userId, data.company_id)
        }
        return true // Can create personal/public components

      case 'read':
        // Can read components they have access to (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify components in companies they're members of
        if (resourceId) {
          return await DatabaseHelper.canAccessComponent(userId, resourceId, 'swarm_user')
        }
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminComponentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create components for managed companies
        if (data?.company_id) {
          return await DatabaseHelper.isCompanyAdmin(userId, data.company_id)
        }
        return true // Can create public components

      case 'read':
        // Can read company components and public components (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify components in managed companies
        if (resourceId) {
          const component = await DatabaseHelper.getComponentById(resourceId)
          if (component?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, component.company_id)
          }
          return component?.is_public || false // Can modify public components
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminComponentAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'component:create',
      read: 'component:read',
      update: 'component:update',
      delete: 'component:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateOrganizationAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserOrganizationAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminOrganizationAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminOrganizationAccess(context)
      case 'swarm_public':
        // Only read access to public organizations
        return operation === 'read' && (data?.is_public === true || !data)
      default:
        return false
    }
  }

  private static async validateSwarmUserOrganizationAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create organizations for themselves and companies they're members of
        if (data?.user_id && data.user_id !== userId) {
          return false // Can only create for themselves
        }
        if (data?.company_id) {
          return await DatabaseHelper.isUserInCompany(userId, data.company_id)
        }
        return true // Can create personal organizations

      case 'read':
        // Can read organizations they have access to (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify their own organizations
        if (resourceId) {
          const organization = await DatabaseHelper.getOrganizationById(resourceId)
          return organization?.user_id === userId
        }
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminOrganizationAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create organizations for users in managed companies
        if (data?.user_id && data.user_id !== userId) {
          const adminCompanies = await DatabaseHelper.getUserAdminCompanies(userId)
          const targetUserCompanies = await DatabaseHelper.getUserCompanies(data.user_id)
          return adminCompanies.some((companyId) => targetUserCompanies.includes(companyId))
        }
        if (data?.company_id) {
          return await DatabaseHelper.isCompanyAdmin(userId, data.company_id)
        }
        return true // Can create personal organizations

      case 'read':
        // Can read company organizations and public organizations (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify organizations in managed companies or own organizations
        if (resourceId) {
          const organization = await DatabaseHelper.getOrganizationById(resourceId)
          if (organization?.user_id === userId) return true // Own organization
          if (organization?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, organization.company_id)
          }
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminOrganizationAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'organization:create',
      read: 'organization:read',
      update: 'organization:update',
      delete: 'organization:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateTeamAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserTeamAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminTeamAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminTeamAccess(context)
      case 'swarm_public':
        // Only read access to public teams
        return operation === 'read' && (data?.is_public === true || !data)
      default:
        return false
    }
  }

  private static async validateSwarmUserTeamAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create teams for themselves and companies they're members of
        if (data?.user_id && data.user_id !== userId) {
          return false // Can only create for themselves
        }
        if (data?.company_id) {
          return await DatabaseHelper.isUserInCompany(userId, data.company_id)
        }
        return true // Can create personal teams

      case 'read':
        // Can read teams they have access to (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify their own teams
        if (resourceId) {
          const team = await DatabaseHelper.getTeamById(resourceId)
          return team?.user_id === userId
        }
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminTeamAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create teams for users in managed companies
        if (data?.user_id && data.user_id !== userId) {
          const adminCompanies = await DatabaseHelper.getUserAdminCompanies(userId)
          const targetUserCompanies = await DatabaseHelper.getUserCompanies(data.user_id)
          return adminCompanies.some((companyId) => targetUserCompanies.includes(companyId))
        }
        if (data?.company_id) {
          return await DatabaseHelper.isCompanyAdmin(userId, data.company_id)
        }
        return true // Can create personal teams

      case 'read':
        // Can read company teams and public teams (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify teams in managed companies or own teams
        if (resourceId) {
          const team = await DatabaseHelper.getTeamById(resourceId)
          if (team?.user_id === userId) return true // Own team
          if (team?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, team.company_id)
          }
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminTeamAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'team:create',
      read: 'team:read',
      update: 'team:update',
      delete: 'team:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateLlmstxtAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserLlmstxtAccess(context)
      case 'swarm_company_admin':
        return await this.validateCompanyAdminLlmstxtAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminLlmstxtAccess(context)
      case 'swarm_public':
        // Only read access to public llmstxt entries
        return operation === 'read' && (data?.is_public === true || !data)
      default:
        return false
    }
  }

  private static async validateSwarmUserLlmstxtAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create llmstxt entries for themselves and companies they're members of
        if (data?.user_id && data.user_id !== userId) {
          return false // Can only create for themselves
        }
        if (data?.company_id) {
          return await DatabaseHelper.isUserInCompany(userId, data.company_id)
        }
        return true // Can create personal llmstxt entries

      case 'read':
        // Can read llmstxt entries they have access to (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can only modify their own llmstxt entries
        if (resourceId) {
          const llmstxt = await DatabaseHelper.getLlmstxtById(resourceId)
          return llmstxt?.user_id === userId
        }
        return false

      default:
        return false
    }
  }

  private static async validateCompanyAdminLlmstxtAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create llmstxt entries for users in managed companies
        if (data?.user_id && data.user_id !== userId) {
          const adminCompanies = await DatabaseHelper.getUserAdminCompanies(userId)
          const targetUserCompanies = await DatabaseHelper.getUserCompanies(data.user_id)
          return adminCompanies.some((companyId) => targetUserCompanies.includes(companyId))
        }
        if (data?.company_id) {
          return await DatabaseHelper.isCompanyAdmin(userId, data.company_id)
        }
        return true // Can create personal llmstxt entries

      case 'read':
        // Can read company llmstxt entries and public entries (filtering handled in extension)
        return true

      case 'update':
      case 'delete':
        // Can modify llmstxt entries in managed companies or own entries
        if (resourceId) {
          const llmstxt = await DatabaseHelper.getLlmstxtById(resourceId)
          if (llmstxt?.user_id === userId) return true // Own entry
          if (llmstxt?.company_id) {
            return await DatabaseHelper.isCompanyAdmin(userId, llmstxt.company_id)
          }
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminLlmstxtAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'llmstxt:create',
      read: 'llmstxt:read',
      update: 'llmstxt:update',
      delete: 'llmstxt:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateWaitlistAccess(context: SecurityContext): Promise<boolean> {
    const { userRole, operation, userId, data, resourceId } = context

    switch (userRole) {
      case 'swarm_user':
        return await this.validateSwarmUserWaitlistAccess(context)
      case 'swarm_admin':
        return await this.validateSwarmAdminWaitlistAccess(context)
      case 'swarm_public':
        // Public users can only create waitlist entries
        return operation === 'create'
      default:
        return false
    }
  }

  private static async validateSwarmUserWaitlistAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId, data, resourceId } = context

    switch (operation) {
      case 'create':
        // Can create waitlist entries for themselves
        if (data?.user_id && data.user_id !== userId) {
          return false // Can only create for themselves
        }
        return true

      case 'read':
        // Can read their own waitlist entries
        if (resourceId) {
          const entry = await DatabaseHelper.getWaitlistEntryById(resourceId)
          return entry?.user_id === userId
        }
        return true // Will be filtered in extension

      case 'update':
        // Can only update their own entries with limited fields
        if (resourceId) {
          const entry = await DatabaseHelper.getWaitlistEntryById(resourceId)
          return entry?.user_id === userId
        }
        return false

      default:
        return false
    }
  }

  private static async validateSwarmAdminWaitlistAccess(context: SecurityContext): Promise<boolean> {
    const { operation, userId } = context

    // Must have explicit function-based permissions
    const permissionMap = {
      create: 'waitlist:create',
      read: 'waitlist:read',
      update: 'waitlist:update',
      delete: 'waitlist:delete',
    }

    const requiredPermission = permissionMap[operation]
    return await DatabaseHelper.hasPermission(userId, requiredPermission)
  }

  private static async validateToolAccess(context: SecurityContext): Promise<boolean> {
    // Placeholder for tool access validation
    return true
  }

  private static async validateWorkflowAccess(context: SecurityContext): Promise<boolean> {
    // Placeholder for workflow access validation
    return true
  }
}

// SecurityError class for permission violations
export class SecurityError extends Error {
  public name = 'SecurityError'
  public context: any

  constructor(message: string, context: any) {
    super(message)
    this.context = context

    // Log security violations for audit purposes
    console.error(`[SecurityError] ${message}`, context)
  }
}

// Global function to throw SecurityError
export function throwSecurityError(message: string, context: any): never {
  throw new SecurityError(message, context)
}
