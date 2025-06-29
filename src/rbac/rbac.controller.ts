import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Permissions } from '../common/decorators/auth.decorator';
import { Permission } from '../common/enums/permission.enum';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
} from './dto/assign-role.dto';
import { RbacService } from './rbac.service';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(AuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  @Permissions(Permission.COMPANY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Post('roles/assign')
  @Permissions(Permission.COMPANY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Assign a role to a user in a company' })
  @ApiResponse({
    status: 201,
    description: 'Role assigned successfully',
  })
  async assignRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.assignRole(dto);
  }

  @Put('roles/permissions')
  @Permissions(Permission.COMPANY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions updated successfully',
  })
  async updateRolePermissions(@Body() dto: UpdateRolePermissionsDto) {
    return this.rbacService.updateRolePermissions(dto);
  }

  @Get('roles')
  @Permissions(Permission.COMPANY_MANAGE_ROLES)
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of all roles with their permissions',
  })
  async listRoles() {
    return this.rbacService.listRoles();
  }

  @Get('permissions')
  @Permissions(Permission.COMPANY_MANAGE_ROLES)
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of all available permissions',
  })
  async listPermissions() {
    return this.rbacService.listPermissions();
  }
}
