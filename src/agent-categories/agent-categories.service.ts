import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentCategoryDto } from './dto/create-agent-category.dto';
import { UpdateAgentCategoryDto } from './dto/update-agent-category.dto';

@Injectable()
export class AgentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAgentCategoryDto: CreateAgentCategoryDto,
    userId: string,
  ): Promise<AgentCategory> {
    const { name } = createAgentCategoryDto;

    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Category name is required');
    }

    const where: Prisma.AgentCategoryWhereInput = {
      name,
    };

    const existingCategory = await this.prisma.agentCategory.findFirst({
      where,
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }

    return this.prisma.agentCategory.create({
      data: createAgentCategoryDto,
    });
  }

  async findAll(): Promise<AgentCategory[]> {
    return this.prisma.agentCategory.findMany();
  }

  async findOne(id: string): Promise<AgentCategory | null> {
    const category = await this.prisma.agentCategory.findUnique({
      where: { category_id: id },
    });

    if (!category) {
      throw new NotFoundException(`Agent category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateAgentCategoryDto: UpdateAgentCategoryDto,
    userId: string,
  ): Promise<AgentCategory> {
    await this.findOne(id);

    if (updateAgentCategoryDto.name) {
      const where: Prisma.AgentCategoryWhereInput = {
        name: updateAgentCategoryDto.name,
        category_id: { not: id },
      };
      const existingCategory = await this.prisma.agentCategory.findFirst({
        where,
      });
      if (existingCategory) {
        throw new ConflictException('Category name already exists');
      }
    }

    return this.prisma.agentCategory.update({
      where: { category_id: id },
      data: {
        ...updateAgentCategoryDto,
      },
    });
  }

  async remove(id: string): Promise<any> {
    await this.findOne(id);
    return this.prisma.agentCategory.delete({
      where: { category_id: id },
    });
  }
}
