import { Injectable, NotFoundException } from '@nestjs/common';
import { Agent } from '@prisma/client';
import extendedClient from '../prisma/extended-client';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  private readonly prisma = extendedClient;

  async create(createAgentDto: CreateAgentDto, userId: string): Promise<Agent> {
    return this.prisma.agent.createAgent(createAgentDto, userId);
  }

  async findAll(): Promise<Agent[]> {
    return this.prisma.agent.getAgents();
  }

  async findOne(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.getAgentById(id);

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

    return this.prisma.agent.updateAgent(id, updateAgentDto, userId);
  }

  async remove(id: string): Promise<any> {
    const existingAgent = await this.findOne(id);
    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return this.prisma.agent.deleteAgent(id);
  }
}
