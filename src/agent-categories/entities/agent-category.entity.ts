import { ApiProperty } from '@nestjs/swagger';
import { AgentCategory as PrismaAgentCategory } from '@prisma/client';

export class AgentCategory implements PrismaAgentCategory {
  @ApiProperty({
    description: 'The id of the agent category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  category_id: string;

  @ApiProperty({ description: 'Category name', example: 'Sales' })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Agents related to sales',
  })
  description: string | null;

  @ApiProperty({
    description: 'Additional metadata',
    example: '{}',
    required: false,
  })
  metadata: any;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
