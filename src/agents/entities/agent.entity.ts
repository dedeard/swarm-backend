import { Agent as PrismaAgent } from '@prisma/client';

export class Agent implements PrismaAgent {
  agent_id: string;
  user_id: string | null;
  company_id: string | null;
  agent_name: string;
  description: string | null;
  route_path: string | null;
  agent_style: string | null;
  on_status: boolean | null;
  created_at: Date | null;
  public_hash: string | null;
  is_public: boolean | null;
  avatar_url: string | null;
  category_id: string | null;
  template_id: string | null;
  workflow_id: string | null;
  use_memory: boolean | null;
  media_input: any;
  media_output: any;
  use_tool: boolean | null;
  model_default: string | null;

  get id(): string {
    return this.agent_id;
  }
}
