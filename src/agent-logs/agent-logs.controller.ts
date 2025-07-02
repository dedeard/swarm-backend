import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { AgentLogsService } from './agent-logs.service';
import { GetMessagesPaginatedDto } from './dto/queries/get-messages-paginated.dto';
import { CreateChatMessagesDto } from './dto/requests/create-chat-messages.dto';

@Controller('agent-logs')
@UseGuards(AuthGuard)
export class AgentLogsController {
  constructor(private readonly agentLogsService: AgentLogsService) {}

  @Get('threads/:agentId')
  async getThreadHistories(
    @Param('agentId') agentId: string,
    @User('user_id') userId: string,
  ) {
    return this.agentLogsService.getThreadHistories(agentId, userId);
  }

  @Get('messages/:id')
  async getThreadById(
    @Param('id') agentLogId: string,
    @User('user_id') userId: string,
  ) {
    return this.agentLogsService.getThreadById(agentLogId, userId);
  }

  @Get('messages/paginated/:id')
  async getChatMessagesPaginated(
    @Param('id') agentLogId: string,
    @User('user_id') userId: string,
    @Query() query: GetMessagesPaginatedDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    return this.agentLogsService.getChatMessagesPaginated(
      agentLogId,
      userId,
      page,
      pageSize,
    );
  }

  @Post('messages/:threadid')
  async createChatMessages(
    @Param('threadid') threadId: string,
    @Body() createMessagesDto: CreateChatMessagesDto,
    @User('user_id') userId: string,
  ) {
    return this.agentLogsService.createChatMessages(
      threadId,
      createMessagesDto,
      userId,
    );
  }
}
