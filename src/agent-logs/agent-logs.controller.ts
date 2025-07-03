import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AgentLogsService } from './agent-logs.service';

@Controller('agent-logs')
@UseGuards(AuthGuard)
export class AgentLogsController {
  constructor(private readonly agentLogsService: AgentLogsService) {}

  @Get('threads/:agentId')
  async getThreadHistories(@Param('agentId') agentId: string) {
    return this.agentLogsService.getThreadHistories(agentId);
  }

  @Get('messages/:id')
  async getThreadById(@Param('id') agentLogId: string) {
    return this.agentLogsService.getThreadById(agentLogId);
  }
}
