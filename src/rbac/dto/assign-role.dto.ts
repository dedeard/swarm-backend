import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'User ID to assign role to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Company ID context',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'Role ID to assign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Role ID to update permissions for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsUUID('4', { each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'CUSTOM_ROLE',
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;
}
