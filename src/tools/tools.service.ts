import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateToolSecretDto,
  ShareToolSecretWithCompanyRoleDto,
  ShareToolSecretWithUserDto,
} from './dto/create-tool-secret.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolSecretDto } from './dto/update-tool-secret.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createToolDto: CreateToolDto) {
    return this.prisma.tool.create({
      data: createToolDto,
      include: {
        company: true,
      },
    });
  }

  async findAll(userId?: string, companyId?: string) {
    const where = {
      OR: [{ is_public: true }, { user_id: userId }, { company_id: companyId }],
    };

    return this.prisma.tool.findMany({
      where,
      include: {
        company: true,
      },
    });
  }

  async findOne(toolId: string) {
    return this.prisma.tool.findUnique({
      where: { tool_id: toolId },
      include: {
        company: true,
        tool_secrets: {
          select: {
            secret_id: true,
            description: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async update(toolId: string, updateToolDto: UpdateToolDto) {
    return this.prisma.tool.update({
      where: { tool_id: toolId },
      data: updateToolDto,
      include: {
        company: true,
      },
    });
  }

  async remove(toolId: string) {
    return this.prisma.tool.delete({
      where: { tool_id: toolId },
    });
  }

  // Tool Secret Management
  async createSecret(userId: string, createToolSecretDto: CreateToolSecretDto) {
    return this.prisma.toolSecret.create({
      data: {
        ...createToolSecretDto,
        owner_user_id: userId,
      },
      include: {
        tool: true,
      },
    });
  }

  async updateSecret(
    secretId: string,
    updateToolSecretDto: UpdateToolSecretDto,
  ) {
    return this.prisma.toolSecret.update({
      where: { secret_id: secretId },
      data: updateToolSecretDto,
      include: {
        tool: true,
      },
    });
  }

  async removeSecret(secretId: string) {
    return this.prisma.toolSecret.delete({
      where: { secret_id: secretId },
    });
  }

  async shareSecretWithUser(
    secretId: string,
    shareDto: ShareToolSecretWithUserDto,
  ) {
    return this.prisma.toolSecretShareUser.create({
      data: {
        secret_id: secretId,
        shared_with_user_id: shareDto.shared_with_user_id,
      },
    });
  }

  async shareSecretWithCompanyRole(
    secretId: string,
    shareDto: ShareToolSecretWithCompanyRoleDto,
  ) {
    return this.prisma.toolSecretShareCompanyRole.create({
      data: {
        secret_id: secretId,
        shared_with_company_id: shareDto.shared_with_company_id,
        shared_with_role_id: shareDto.shared_with_role_id,
      },
    });
  }

  async revokeSecretFromUser(secretId: string, userId: string) {
    return this.prisma.toolSecretShareUser.delete({
      where: {
        secret_id_shared_with_user_id: {
          secret_id: secretId,
          shared_with_user_id: userId,
        },
      },
    });
  }

  async revokeSecretFromCompanyRole(
    secretId: string,
    companyId: string,
    roleId: string,
  ) {
    return this.prisma.toolSecretShareCompanyRole.delete({
      where: {
        secret_id_shared_with_company_id_shared_with_role_id: {
          secret_id: secretId,
          shared_with_company_id: companyId,
          shared_with_role_id: roleId,
        },
      },
    });
  }
}
