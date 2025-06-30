import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

enum MediaType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
}

enum AIModel {
  GPT35 = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4',
  GPT4TURBO = 'gpt-4-turbo',
  CLAUDE2 = 'claude-2',
}

export class CreateAgentDto {
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  agent_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\/api\/agents\/[a-z0-9-]+$/, {
    message:
      'Invalid route path format. Must start with /api/agents/ followed by lowercase letters, numbers, and hyphens',
  })
  route_path?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  agent_style?: string;

  @IsBoolean()
  @IsOptional()
  on_status?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{8,32}$/, {
    message:
      'Invalid hash format. Must be 8-32 characters of letters, numbers, and underscores',
  })
  public_hash?: string;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @IsOptional()
  avatar_url?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsUUID()
  @IsOptional()
  template_id?: string;

  @IsUUID()
  @IsOptional()
  workflow_id?: string;

  @IsBoolean()
  @IsOptional()
  use_memory?: boolean;

  @IsArray()
  @IsEnum(MediaType, { each: true })
  @IsOptional()
  media_input?: MediaType[];

  @IsArray()
  @IsEnum(MediaType, { each: true })
  @IsOptional()
  media_output?: MediaType[];

  @IsBoolean()
  @IsOptional()
  use_tool?: boolean;

  @IsEnum(AIModel)
  @IsOptional()
  model_default?: AIModel;
}
