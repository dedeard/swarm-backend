import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentLogsService {
  constructor(private prisma: PrismaService) {}

  async getThreadHistories(agentId: string) {
    const threads = await this.prisma.agentLog.findMany({
      where: {
        agent_id: agentId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      threads,
      total_records: threads.length,
    };
  }

  async getThreadById(agentLogId: string) {
    const thread = await this.prisma.agentLog.findUnique({
      where: {
        agent_log_id: agentLogId,
      },
      include: {
        chat_messages: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    return thread;
  }
}
