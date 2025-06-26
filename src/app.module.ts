import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AgentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
