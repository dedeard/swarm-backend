import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatMessagesDto } from './dto/requests/create-chat-messages.dto';
import { PaginatedMessagesResponse } from './dto/responses/chat-messages.response';
import { ThreadHistoryResponse } from './dto/responses/thread-history.response';

@Injectable()
export class AgentLogsService {
  constructor(private prisma: PrismaService) {}

  async getThreadHistories(
    agentId: string,
    userId: string,
  ): Promise<ThreadHistoryResponse> {
    const threads = await this.prisma.agentLog.findMany({
      where: {
        agent_id: agentId,
        user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        agent_log_id: true,
        session_title: true,
        created_at: true,
      },
    });

    return {
      threads: threads.map((thread) => ({
        agent_log_id: thread.agent_log_id,
        thread_title: thread.session_title || '',
        created_at: thread.created_at,
      })),
      total_records: threads.length,
    };
  }

  async getThreadById(agentLogId: string, userId: string) {
    const thread = await this.prisma.agentLog.findUnique({
      where: {
        agent_log_id: agentLogId,
      },
      select: {
        agent_log_id: true,
        session_title: true,
        created_at: true,
        user_id: true,
      },
    });

    if (!thread || thread.user_id !== userId) {
      throw new NotFoundException('Thread not found or access denied');
    }

    return {
      agent_log_id: thread.agent_log_id,
      thread_title: thread.session_title || '',
      created_at: thread.created_at,
    };
  }

  async getChatMessagesPaginated(
    agentLogId: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedMessagesResponse> {
    if (page < 1 || pageSize <= 0) {
      return {
        messages: [],
        pagination: {
          page,
          page_size: pageSize,
          total_records: 0,
          total_pages: 0,
        },
      };
    }

    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      this.prisma.agentChatHistory.findMany({
        where: {
          agent_log_id: agentLogId,
          agent_log: {
            user_id: userId,
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          created_at: 'asc',
        },
        select: {
          content: true,
          role: true,
          created_at: true,
        },
      }),
      this.prisma.agentChatHistory.count({
        where: {
          agent_log_id: agentLogId,
          agent_log: {
            user_id: userId,
          },
        },
      }),
    ]);

    if (total === 0) {
      throw new NotFoundException('Thread not found or access denied');
    }

    return {
      messages: messages.map((msg) => ({
        message: msg.content,
        role: msg.role,
        created_at: msg.created_at,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total_records: total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async createChatMessages(
    threadId: string,
    input: CreateChatMessagesDto,
    userId: string,
  ) {
    // Try to find existing thread
    const existingThread = await this.prisma.agentLog.findUnique({
      where: { agent_log_id: threadId },
    });

    let agentLogId: string;

    if (!existingThread || existingThread.user_id !== userId) {
      // Create new thread if not exists or doesn't belong to user
      const newThread = await this.prisma.agentLog.create({
        data: {
          agent_id: input.agent_id,
          user_id: userId,
          session_title: 'New Conversation',
        },
      });
      agentLogId = newThread.agent_log_id;
    } else {
      // Use existing thread
      agentLogId = threadId;
    }

    // Create all chat messages in a transaction
    const messages = await this.prisma.$transaction(
      input.messages.map((msg) =>
        this.prisma.agentChatHistory.create({
          data: {
            agent_log_id: agentLogId,
            content: msg.content,
            role: msg.role,
            user_id: msg.role === 'user' ? userId : null,
            input_tokens: msg.input_tokens,
            output_tokens: msg.output_tokens,
            processing_time_ms: msg.processing_time_ms,
            metadata: msg.metadata,
          },
        }),
      ),
    );

    return {
      agent_log_id: agentLogId,
      messages,
    };
  }
}
