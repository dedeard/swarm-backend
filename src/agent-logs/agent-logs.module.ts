import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentLogsController } from './agent-logs.controller';
import { AgentLogsService } from './agent-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AgentLogsController],
  providers: [AgentLogsService],
})
export class AgentLogsModule {}
