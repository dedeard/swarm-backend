import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
}
