import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/auth.decorator';
import { Permission } from '../enums/permission.enum';
import { IS_COMPANY_MODE_KEY } from './mode.guard';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User context required');
    }

    // Check if we're in company mode
    const isCompanyMode = this.reflector.getAllAndOverride<boolean>(
      IS_COMPANY_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isCompanyMode) {
      const companyId = request.headers['x-company-id'];
      if (!companyId) {
        throw new UnauthorizedException(
          'Company context required in company mode',
        );
      }

      // First check cache
      const cachedPermissions = await this.checkPermissionCache(
        user.id,
        requiredPermissions,
      );

      if (cachedPermissions.length === requiredPermissions.length) {
        return true;
      }

      // If not in cache, check database
      const userCompany = await this.prisma.userCompany.findUnique({
        where: {
          user_id_company_id: {
            user_id: user.id,
            company_id: companyId,
          },
        },
        include: {
          role: {
            include: {
              role_function_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!userCompany?.role) {
        return false;
      }

      const userPermissions = userCompany.role.role_function_permissions.map(
        (rfp) => rfp.permission?.function_name,
      );

      // Cache the permissions
      await this.cachePermissions(user.id, userPermissions as Permission[]);

      // Check if user has all required permissions
      return requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
    } else {
      // Individual mode - check if user owns the tool
      const tool = await this.prisma.tool.findFirst({
        where: {
          scope_type: ScopeType.INDIVIDUAL,
          owner_id: user.id,
        },
      });

      // In individual mode, if the user is the owner, they have all permissions
      if (tool && tool.owner_id === user.id) {
        return true;
      }

      return false;
    }
  }

  private async checkPermissionCache(
    userId: string,
    permissions: Permission[],
  ): Promise<Permission[]> {
    const cachedPermissions = await this.prisma.userPermissionCache.findMany({
      where: {
        user_id: userId,
        permission_name: {
          in: permissions,
        },
        has_permission: true,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    return cachedPermissions.map(
      (cache) => cache.permission_name as Permission,
    );
  }

  private async cachePermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 minutes

    await Promise.all(
      permissions.map((permission) =>
        this.prisma.userPermissionCache.upsert({
          where: {
            user_id_permission_name: {
              user_id: userId,
              permission_name: permission,
            },
          },
          update: {
            has_permission: true,
            cached_at: now,
            expires_at: expiresAt,
          },
          create: {
            user_id: userId,
            permission_name: permission,
            has_permission: true,
            cached_at: now,
            expires_at: expiresAt,
          },
        }),
      ),
    );
  }
}
