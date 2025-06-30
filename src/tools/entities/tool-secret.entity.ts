import { Tool } from './tool.entity';

export class ToolSecret {
  secret_id: string;
  owner_user_id: string;
  tool_id: string;
  vault_secret_id: string;
  encrypted_secret_value: string;
  description?: string;
  created_at: Date;
  updated_at: Date;

  // Relations
  tool?: Tool;
}

export class ToolSecretShareUser {
  secret_id: string;
  shared_with_user_id: string;
  granted_at: Date;

  // Relations
  tool_secret?: ToolSecret;
}

export class ToolSecretShareCompanyRole {
  secret_id: string;
  shared_with_company_id: string;
  shared_with_role_id: string;
  granted_at: Date;

  // Relations
  tool_secret?: ToolSecret;
  company?: any;
  role?: any;
}
