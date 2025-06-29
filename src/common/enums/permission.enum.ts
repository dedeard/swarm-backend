export enum Permission {
  // Agent Permissions
  AGENT_CREATE = 'agent:create',
  AGENT_READ = 'agent:read',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  AGENT_MANAGE_PROMPTS = 'agent:manage_prompts',
  AGENT_MANAGE_TOOLS = 'agent:manage_tools',
  AGENT_MANAGE_CATEGORIES = 'agent:manage_categories',
  AGENT_VIEW_LOGS = 'agent:view_logs',

  // Company Permissions
  COMPANY_MANAGE_USERS = 'company:manage_users',
  COMPANY_MANAGE_SETTINGS = 'company:manage_settings',
  COMPANY_VIEW_ANALYTICS = 'company:view_analytics',
  COMPANY_MANAGE_ROLES = 'company:manage_roles',
  COMPANY_MANAGE_BILLING = 'company:manage_billing',

  // Tool Permissions
  TOOL_CREATE = 'tool:create',
  TOOL_READ = 'tool:read',
  TOOL_UPDATE = 'tool:update',
  TOOL_DELETE = 'tool:delete',
  TOOL_MANAGE_SECRETS = 'tool:manage_secrets',
  TOOL_MANAGE_SETTINGS = 'tool:manage_settings',

  // General Permissions
  MANAGE_API_KEYS = 'system:manage_api_keys',
  VIEW_AUDIT_LOGS = 'system:view_audit_logs',
  MANAGE_WEBHOOKS = 'system:manage_webhooks',
}
