-- Create default roles
INSERT INTO "swarm-rbac"."roles" (role_id, role_name)
VALUES
  (gen_random_uuid(), 'ADMIN'),
  (gen_random_uuid(), 'MANAGER'),
  (gen_random_uuid(), 'AGENT_MANAGER'),
  (gen_random_uuid(), 'TOOL_MANAGER'),
  (gen_random_uuid(), 'USER')
ON CONFLICT (role_name) DO NOTHING;

-- Create function permissions
INSERT INTO "swarm-rbac"."function_permissions" (permission_id, function_name, description)
VALUES
  -- Agent Permissions
  (gen_random_uuid(), 'agent:create', 'Create new agents'),
  (gen_random_uuid(), 'agent:read', 'View agents'),
  (gen_random_uuid(), 'agent:update', 'Update agents'),
  (gen_random_uuid(), 'agent:delete', 'Delete agents'),
  (gen_random_uuid(), 'agent:manage_prompts', 'Manage agent prompts'),
  (gen_random_uuid(), 'agent:manage_tools', 'Manage agent tools'),
  (gen_random_uuid(), 'agent:manage_categories', 'Manage agent categories'),
  (gen_random_uuid(), 'agent:view_logs', 'View agent logs'),

  -- Company Permissions
  (gen_random_uuid(), 'company:manage_users', 'Manage company users'),
  (gen_random_uuid(), 'company:manage_settings', 'Manage company settings'),
  (gen_random_uuid(), 'company:view_analytics', 'View company analytics'),
  (gen_random_uuid(), 'company:manage_roles', 'Manage company roles'),
  (gen_random_uuid(), 'company:manage_billing', 'Manage company billing'),

  -- Tool Permissions
  (gen_random_uuid(), 'tool:create', 'Create new tools'),
  (gen_random_uuid(), 'tool:read', 'View tools'),
  (gen_random_uuid(), 'tool:update', 'Update tools'),
  (gen_random_uuid(), 'tool:delete', 'Delete tools'),
  (gen_random_uuid(), 'tool:manage_secrets', 'Manage tool secrets'),
  (gen_random_uuid(), 'tool:manage_settings', 'Manage tool settings'),

  -- General Permissions
  (gen_random_uuid(), 'system:manage_api_keys', 'Manage API keys'),
  (gen_random_uuid(), 'system:view_audit_logs', 'View audit logs'),
  (gen_random_uuid(), 'system:manage_webhooks', 'Manage webhooks')
ON CONFLICT (function_name) DO NOTHING;

-- Assign permissions to roles
WITH roles AS (
  SELECT role_id, role_name FROM "swarm-rbac"."roles"
),
permissions AS (
  SELECT permission_id, function_name FROM "swarm-rbac"."function_permissions"
)
INSERT INTO "swarm-rbac"."role_function_permissions" (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  r.role_id,
  p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE 
  -- ADMIN gets all permissions
  r.role_name = 'ADMIN'
  OR
  -- MANAGER gets all except system management
  (r.role_name = 'MANAGER' AND p.function_name NOT LIKE 'system:%')
  OR
  -- AGENT_MANAGER gets all agent permissions
  (r.role_name = 'AGENT_MANAGER' AND p.function_name LIKE 'agent:%')
  OR
  -- TOOL_MANAGER gets all tool permissions
  (r.role_name = 'TOOL_MANAGER' AND p.function_name LIKE 'tool:%')
  OR
  -- USER gets basic read permissions
  (r.role_name = 'USER' AND p.function_name IN ('agent:read', 'tool:read'))
ON CONFLICT DO NOTHING;
