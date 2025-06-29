import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
} from './dto/assign-role.dto';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async assignRole(dto: AssignRoleDto) {
    const { userId, companyId, roleId } = dto;

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if user already has a role in this company
    const existingRole = await this.prisma.userCompany.findUnique({
      where: {
        user_id_company_id: {
          user_id: userId,
          company_id: companyId,
        },
      },
    });

    if (existingRole) {
      // Update existing role
      return this.prisma.userCompany.update({
        where: {
          user_id_company_id: {
            user_id: userId,
            company_id: companyId,
          },
        },
        data: {
          role_id: roleId,
        },
        include: {
          role: true,
        },
      });
    }

    // Create new user-company role assignment
    return this.prisma.userCompany.create({
      data: {
        user_id: userId,
        company_id: companyId,
        role_id: roleId,
      },
      include: {
        role: true,
      },
    });
  }

  async createRole(dto: CreateRoleDto) {
    const { roleName } = dto;

    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { role_name: roleName },
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.role.create({
      data: {
        role_name: roleName,
      },
    });
  }

  async updateRolePermissions(dto: UpdateRolePermissionsDto) {
    const { roleId, permissionIds } = dto;

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.functionPermission.findMany({
      where: {
        permission_id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Delete existing permissions
    await this.prisma.roleFunctionPermission.deleteMany({
      where: {
        role_id: roleId,
      },
    });

    // Assign new permissions
    await this.prisma.roleFunctionPermission.createMany({
      data: permissionIds.map((permissionId) => ({
        id: randomUUID(),
        role_id: roleId,
        permission_id: permissionId,
      })),
    });

    return this.prisma.role.findUnique({
      where: { role_id: roleId },
      include: {
        role_function_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getUserRoleInCompany(userId: string, companyId: string) {
    const userCompany = await this.prisma.userCompany.findUnique({
      where: {
        user_id_company_id: {
          user_id: userId,
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

    if (!userCompany) {
      throw new UnauthorizedException('User has no role in this company');
    }

    return userCompany;
  }

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        role_function_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async listPermissions() {
    return this.prisma.functionPermission.findMany();
  }
}
