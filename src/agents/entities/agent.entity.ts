import { ApiProperty } from '@nestjs/swagger';
import { Agent as PrismaAgent } from '@prisma/client';

export class Agent implements PrismaAgent {
  @ApiProperty({
    description: 'The id of the agent',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  agent_id: string;

  @ApiProperty({
    description: 'Owner user ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  user_id: string | null;

  @ApiProperty({
    description: 'Associated company for multi-tenancy',
    example: '00000000-0000-0000-0000-000000000000',
  })
  company_id: string | null;

  @ApiProperty({ description: 'Agent display name', example: 'Sales Bot' })
  agent_name: string;

  @ApiProperty({
    description: 'Agent description and purpose',
    example: 'An AI-powered sales assistant.',
  })
  description: string | null;

  @ApiProperty({
    description: 'API route path for agent access',
    example: '/api/agents/sales-bot',
  })
  route_path: string | null;

  @ApiProperty({
    description: 'Agent personality/style configuration',
    example: 'Friendly and helpful',
  })
  agent_style: string | null;

  @ApiProperty({ description: 'Agent active/inactive status', example: true })
  on_status: boolean | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date | null;

  @ApiProperty({
    description: 'Public access hash for sharing',
    example: 'abc123xyz',
  })
  public_hash: string | null;

  @ApiProperty({ description: 'Public visibility flag', example: false })
  is_public: boolean | null;

  @ApiProperty({
    description: 'Agent avatar image URL',
    example: 'https://example.com/avatar.png',
  })
  avatar_url: string | null;

  @ApiProperty({
    description: 'Agent category classification',
    example: '00000000-0000-0000-0000-000000000000',
  })
  category_id: string | null;

  @ApiProperty({
    description: 'Base template used',
    example: '00000000-0000-0000-0000-000000000000',
  })
  template_id: string | null;

  @ApiProperty({
    description: 'Associated workflow',
    example: '00000000-0000-0000-0000-000000000000',
  })
  workflow_id: string | null;

  @ApiProperty({
    description: 'Memory/context retention enabled',
    example: true,
  })
  use_memory: boolean | null;

  @ApiProperty({
    description: 'Supported input media types',
    example: '["text", "image"]',
  })
  media_input: any;

  @ApiProperty({
    description: 'Supported output media types',
    example: '["text"]',
  })
  media_output: any;

  @ApiProperty({ description: 'Tool usage enabled', example: false })
  use_tool: boolean | null;

  @ApiProperty({
    description: 'Default AI model to use',
    example: 'gpt-4',
  })
  model_default: string | null;

  get id(): string {
    return this.agent_id;
  }
}
