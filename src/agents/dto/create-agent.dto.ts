import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  public_hash?: string;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsUrl()
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
  @IsOptional()
  media_input?: string[];

  @IsArray()
  @IsOptional()
  media_output?: string[];

  @IsBoolean()
  @IsOptional()
  use_tool?: boolean;

  @IsString()
  @IsOptional()
  model_default?: string;
}
