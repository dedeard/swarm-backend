import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'The date when the user was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the user was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
