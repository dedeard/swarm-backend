import { ApiProperty } from '@nestjs/swagger';
import { Prisma, Tool as PrismaTool } from '@prisma/client';

export class Tool implements PrismaTool {
  @ApiProperty({
    description: 'The id of the tool',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tool_id: string;

  @ApiProperty({
    description: 'Associated company for multi-tenancy',
    example: '00000000-0000-0000-0000-000000000000',
  })
  company_id: string | null;

  @ApiProperty({
    description: 'Owner user ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  user_id: string | null;

  @ApiProperty({ description: 'Tool name', example: 'Calculator' })
  name: string;

  @ApiProperty({
    description: 'Tool version',
    example: '1.0.0',
  })
  version: string | null;

  @ApiProperty({
    description: 'Command to install the tool',
    example: 'npm install tool',
  })
  cmd_install_: string | null;

  @ApiProperty({
    description: 'Port used by the tool',
    example: '8080',
  })
  port: string | null;

  @ApiProperty({
    description: 'Method used by the tool',
    example: 'GET',
  })
  method: string | null;

  @ApiProperty({
    description: 'Environment variables for the tool',
    example: { NODE_ENV: 'production' },
    type: 'object',
  })
  env: Prisma.JsonValue;

  @ApiProperty({ description: 'Tool active/inactive status', example: true })
  on_status: boolean | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date | null;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: Date | null;

  @ApiProperty({
    description: 'Tool type',
    example: 'utility',
  })
  type: string | null;

  @ApiProperty({
    description: 'Tool icon URL',
    example: 'https://example.com/icon.png',
  })
  icon: string | null;

  @ApiProperty({
    description: 'Tool tags',
    example: ['math', 'utility'],
    isArray: true,
  })
  tags: Prisma.JsonValue;

  @ApiProperty({
    description: 'Tool input schema',
    example: { type: 'object', properties: {} },
    type: 'object',
  })
  input_schema: Prisma.JsonValue;

  @ApiProperty({
    description: 'Tool output schema',
    example: { type: 'object', properties: {} },
    type: 'object',
  })
  output_schema: Prisma.JsonValue;

  @ApiProperty({
    description: 'Tool documentation URL',
    example: 'https://example.com/docs',
  })
  docs_url: string | null;

  @ApiProperty({
    description: 'Tool source code URL',
    example: 'https://github.com/example/tool',
  })
  source_url: string | null;

  @ApiProperty({
    description: 'Tool homepage URL',
    example: 'https://example.com',
  })
  homepage_url: string | null;

  @ApiProperty({
    description: 'Tool description',
    example: 'A simple calculator tool',
  })
  description: string | null;

  @ApiProperty({
    description: 'Tool author',
    example: 'John Doe',
  })
  author: string | null;

  @ApiProperty({
    description: 'Required environment variables for the tool',
    example: { NODE_ENV: 'production' },
    type: 'object',
  })
  required_env: Prisma.JsonValue | null;

  @ApiProperty({
    description: 'Tool availability status',
    example: 'active',
  })
  status: string | null;

  @ApiProperty({
    description: 'Tool logo URL',
    example: 'https://example.com/logo.png',
  })
  logo_url: string | null;

  @ApiProperty({
    description: 'URL-friendly identifier for the tool',
    example: 'calculator',
  })
  slug: string | null;

  @ApiProperty({
    description: 'Tool website URL',
    example: 'https://example.com/tool',
  })
  website: string | null;

  @ApiProperty({
    description: 'Tool developer/vendor',
    example: 'Example Inc.',
  })
  developer: string | null;

  @ApiProperty({
    description: 'Source code repository URL',
    example: 'https://github.com/example/tool',
  })
  source: string | null;

  @ApiProperty({
    description: 'License type for the tool',
    example: 'MIT',
  })
  license: string | null;

  @ApiProperty({
    description: 'Extended description of the tool',
    example: 'This tool performs complex calculations.',
  })
  detailed_description: string | null;

  @ApiProperty({
    description: 'Security considerations for the tool',
    example: 'Ensure to use HTTPS for all connections.',
  })
  security_note: string | null;

  @ApiProperty({
    description: 'Usage recommendations for the tool',
    example: { usage: 'Use this tool for advanced calculations.' },
    type: 'object',
  })
  usage_suggestions: Prisma.JsonValue | null;

  @ApiProperty({
    description: 'Available functions/capabilities of the tool',
    example: { functions: ['add', 'subtract'] },
    type: 'object',
  })
  functions: Prisma.JsonValue | null;

  @ApiProperty({
    description: 'Public visibility flag',
    example: true,
  })
  is_public: boolean | null;
}
