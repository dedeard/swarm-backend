import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentCategoriesController } from './agent-categories.controller';
import { AgentCategoriesService } from './agent-categories.service';

@Module({
  imports: [PrismaModule],
  controllers: [AgentCategoriesController],
  providers: [AgentCategoriesService],
  exports: [AgentCategoriesService],
})
export class AgentCategoriesModule {}
