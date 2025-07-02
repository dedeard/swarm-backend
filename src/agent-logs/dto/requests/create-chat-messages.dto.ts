import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  role: 'user' | 'agent' | 'system' | 'tool';

  @IsNumber()
  @IsOptional()
  input_tokens?: number;

  @IsNumber()
  @IsOptional()
  output_tokens?: number;

  @IsNumber()
  @IsOptional()
  processing_time_ms?: number;

  @IsOptional()
  metadata?: any;
}

export class CreateChatMessagesDto {
  @IsUUID()
  @IsNotEmpty()
  agent_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
