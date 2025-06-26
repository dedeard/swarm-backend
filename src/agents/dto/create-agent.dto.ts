import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({
    description: 'Owner user ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Associated company for multi-tenancy',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Agent display name', example: 'Sales Bot' })
  @IsString()
  agent_name: string;

  @ApiProperty({
    description: 'Agent description and purpose',
    example: 'An AI-powered sales assistant.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'API route path for agent access',
    example: '/api/agents/sales-bot',
  })
  @IsString()
  @IsOptional()
  route_path?: string;

  @ApiProperty({
    description: 'Agent personality/style configuration',
    example: 'Friendly and helpful',
  })
  @IsString()
  @IsOptional()
  agent_style?: string;

  @ApiProperty({ description: 'Agent active/inactive status', example: true })
  @IsBoolean()
  @IsOptional()
  on_status?: boolean;

  @ApiProperty({
    description: 'Public access hash for sharing',
    example: 'abc123xyz',
  })
  @IsString()
  @IsOptional()
  public_hash?: string;

  @ApiProperty({ description: 'Public visibility flag', example: false })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @ApiProperty({
    description: 'Agent avatar image URL',
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({
    description: 'Agent category classification',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: 'Base template used',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  template_id?: string;

  @ApiProperty({
    description: 'Associated workflow',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  workflow_id?: string;

  @ApiProperty({
    description: 'Memory/context retention enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  use_memory?: boolean;

  @ApiProperty({
    description: 'Supported input media types',
    example: '["text", "image"]',
  })
  @IsJSON()
  @IsOptional()
  media_input?: any;

  @ApiProperty({
    description: 'Supported output media types',
    example: '["text"]',
  })
  @IsJSON()
  @IsOptional()
  media_output?: any;

  @ApiProperty({ description: 'Tool usage enabled', example: false })
  @IsBoolean()
  @IsOptional()
  use_tool?: boolean;

  @ApiProperty({
    description: 'Default AI model to use',
    example: 'gpt-4',
  })
  @IsString()
  @IsOptional()
  model_default?: string;
}
