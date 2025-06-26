import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent } from './entities/agent.entity';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    return (await this.prisma.agent.create({
      data: createAgentDto,
    })) as unknown as Agent;
  }

  async findAll(): Promise<Agent[]> {
    return (await this.prisma.agent.findMany()) as unknown as Agent[];
  }

  async findOne(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      return null;
    }

    return agent as unknown as Agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    // Check if agent exists
    const existingAgent = await this.findOne(id);
    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return (await this.prisma.agent.update({
      where: { id },
      data: updateAgentDto,
    })) as unknown as Agent;
  }

  async remove(id: string): Promise<Agent> {
    // Check if agent exists
    const existingAgent = await this.findOne(id);
    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return (await this.prisma.agent.delete({
      where: { id },
    })) as unknown as Agent;
  }
}
