import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthMetadataGuard } from '../../auth/auth-metadata.guard';
import { AuthGuard } from '../../auth/auth.guard';

export const PUBLIC_ROUTE_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

/**
 * Mark route as public (no authentication required)
 */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);

/**
 * Require authentication for route
 */
export const Auth = () => {
  return applyDecorators(
    UseGuards(AuthGuard, AuthMetadataGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
};

/**
 * Require specific roles for route access
 */
export const Roles = (...roles: string[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    Auth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Insufficient role permissions',
    }),
  );
};

/**
 * Require specific permissions for route access
 */
export const Permissions = (...permissions: string[]) => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    Auth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Insufficient permissions',
    }),
  );
};
