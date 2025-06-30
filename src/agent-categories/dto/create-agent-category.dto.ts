import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoryMetadata } from '../entities/agent-category.entity';

export class CreateAgentCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: CategoryMetadata;
}
