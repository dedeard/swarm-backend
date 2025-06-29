import { Injectable, NotFoundException } from '@nestjs/common';
import { Agent, ScopeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createAgentDto: CreateAgentDto,
    userId: string,
    companyId?: string,
  ): Promise<Agent> {
    const data = {
      ...createAgentDto,
      user_id: userId,
      company_id: companyId,
      scope_type: companyId ? ScopeType.COMPANY : ScopeType.INDIVIDUAL,
      owner_id: companyId ?? userId,
    };
    return this.prisma.agent.create({ data });
  }

  async findAll(userId: string, companyId?: string): Promise<Agent[]> {
    const where = companyId
      ? { scope_type: ScopeType.COMPANY, owner_id: companyId }
      : { scope_type: ScopeType.INDIVIDUAL, owner_id: userId };
    return this.prisma.agent.findMany({ where });
  }

  async findOne(
    id: string,
    userId: string,
    companyId?: string,
  ): Promise<Agent> {
    const agent = await this.prisma.agent.findFirst({
      where: {
        agent_id: id,
        scope_type: companyId ? ScopeType.COMPANY : ScopeType.INDIVIDUAL,
        owner_id: companyId ?? userId,
      },
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
    companyId?: string,
  ): Promise<Agent> {
    await this.findOne(id, userId, companyId);
    return this.prisma.agent.update({
      where: { agent_id: id },
      data: updateAgentDto,
    });
  }

  async remove(id: string, userId: string, companyId?: string): Promise<Agent> {
    await this.findOne(id, userId, companyId);
    return this.prisma.agent.delete({ where: { agent_id: id } });
  }
}
