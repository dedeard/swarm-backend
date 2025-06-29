import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentCategoriesModule } from './agent-categories/agent-categories.module';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { PrismaModule } from './prisma/prisma.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          port: parseInt(process.env.PORT || '3000', 10),
        }),
      ],
    }),
    PrismaModule,
    AgentsModule,
    AuthModule,
    CompaniesModule,
    AgentCategoriesModule,
    ToolsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
