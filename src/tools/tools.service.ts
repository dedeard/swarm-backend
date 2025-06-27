import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Tool } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createToolDto: CreateToolDto, userId: string): Promise<Tool> {
    const { name, company } = createToolDto;

    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Tool name is required');
    }

    const where: Prisma.ToolWhereInput = {
      name,
    };

    if (company) {
      where.company_id = company.create?.company_id;
    } else {
      where.user_id = userId;
    }

    const existingTool = await this.prisma.tool.findFirst({
      where,
    });

    if (existingTool) {
      throw new ConflictException(
        'Tool name already exists for this user or company',
      );
    }

    return this.prisma.tool.create({
      data: {
        ...createToolDto,
        user_id: userId,
      },
    });
  }

  async findAll(): Promise<Tool[]> {
    return this.prisma.tool.findMany();
  }

  async findOne(id: string): Promise<Tool> {
    const tool = await this.prisma.tool.findUnique({
      where: { tool_id: id },
    });

    if (!tool) {
      throw new NotFoundException(`Tool with ID ${id} not found`);
    }

    return tool;
  }

  async update(id: string, updateToolDto: UpdateToolDto): Promise<Tool> {
    await this.findOne(id);
    return this.prisma.tool.update({
      where: { tool_id: id },
      data: { ...updateToolDto },
    });
  }

  async remove(id: string): Promise<Tool> {
    await this.findOne(id);
    return this.prisma.tool.delete({
      where: { tool_id: id },
    });
  }
}
