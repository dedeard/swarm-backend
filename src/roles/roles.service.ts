import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: any): Promise<Role> {
    return (await this.prisma.role.create({
      data: createRoleDto,
    })) as unknown as Role;
  }

  async findAll(): Promise<Role[]> {
    return (await this.prisma.role.findMany()) as unknown as Role[];
  }

  async findOne(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return null;
    }

    return role as unknown as Role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Check if role exists
    const existingRole = await this.findOne(id);
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return (await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    })) as unknown as Role;
  }

  async remove(id: string): Promise<Role> {
    // Check if role exists
    const existingRole = await this.findOne(id);
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return (await this.prisma.role.delete({
      where: { id },
    })) as unknown as Role;
  }
}
