import { Company } from '../../companies/entities/company.entity';

export class Tool {
  tool_id: string;
  name: string;
  description?: string;
  version?: string;
  cmd_install_?: string;
  port?: string;
  method?: string;
  env?: Record<string, any>;
  required_env?: Record<string, any>;
  status?: string;
  user_id?: string;
  company_id?: string;
  logo_url?: string;
  slug?: string;
  website?: string;
  developer?: string;
  source?: string;
  license?: string;
  detailed_description?: string;
  security_note?: string;
  usage_suggestions?: Record<string, any>;
  functions?: Record<string, any>;
  is_public?: boolean;

  // Relations
  company?: Company;
}
