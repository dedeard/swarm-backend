import { ApiProperty } from '@nestjs/swagger';
import { ScopeType } from '@prisma/client';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAgentCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Sales',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Agents related to sales',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Owner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  owner_id: string;

  @ApiProperty({
    description: 'Scope type (INDIVIDUAL or COMPANY)',
    example: 'INDIVIDUAL',
    enum: ScopeType,
  })
  @IsString()
  scope_type: ScopeType;
}
