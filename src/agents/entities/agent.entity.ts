import { ApiProperty } from '@nestjs/swagger';

export class Agent {
  @ApiProperty({
    description: 'The id of the agent',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
