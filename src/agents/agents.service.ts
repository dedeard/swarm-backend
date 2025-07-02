import { Injectable, NotFoundException } from '@nestjs/common';
import { Agent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}
  async create(createAgentDto: CreateAgentDto, userId: string): Promise<Agent> {
    const agentData = {
      ...createAgentDto,
      user_id: userId,
    };

    console.log(`Creating agent: ${agentData.agent_name}`);

    return this.prisma.agent.create({
      data: agentData,
    });
  }

  async findAll(): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      include: {
        category: true,
      },
    });
  }

  async findOne(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { agent_id: id },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
    userId: string,
  ): Promise<Agent> {
    const existingAgent = await this.findOne(id);
    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return this.prisma.agent.update({
      where: { agent_id: id },
      data: updateAgentDto,
    });
  }

  async remove(id: string): Promise<Agent> {
    const existingAgent = await this.findOne(id);
    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return this.prisma.agent.delete({
      where: { agent_id: id },
    });
  }
}
