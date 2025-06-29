import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { Permission } from '../enums/permission.enum';
import { Role } from '../enums/role.enum';
import { PermissionGuard } from '../guards/permission.guard';
import { RoleGuard } from '../guards/role.guard';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export function Auth() {
  return applyDecorators(UseGuards(AuthGuard));
}

export function Roles(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RoleGuard),
  );
}

export function Permissions(...permissions: Permission[]) {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    UseGuards(AuthGuard, PermissionGuard),
  );
}

export function RolesAndPermissions(roles: Role[], permissions: Permission[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    SetMetadata(PERMISSIONS_KEY, permissions),
    UseGuards(AuthGuard, RoleGuard, PermissionGuard),
  );
}
