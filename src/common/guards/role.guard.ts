import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/auth.decorator';
import { Role } from '../enums/role.enum';
import { IS_COMPANY_MODE_KEY } from './mode.guard';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
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

      // Get user's role for the specified company
      const userCompany = await this.prisma.userCompany.findUnique({
        where: {
          user_id_company_id: {
            user_id: user.id,
            company_id: companyId,
          },
        },
        include: {
          role: true,
        },
      });

      if (!userCompany?.role?.role_name) {
        return false;
      }

      // Check if user's role matches any of the required roles
      return requiredRoles.includes(userCompany.role.role_name as Role);
    } else {
      // Individual mode - check tools with INDIVIDUAL scope
      const tool = await this.prisma.tool.findFirst({
        where: {
          scope_type: ScopeType.INDIVIDUAL,
          owner_id: user.id,
        },
      });

      // In individual mode, if the user is the owner, they have full access
      if (tool && tool.owner_id === user.id) {
        return true;
      }

      return false;
    }
  }
}
