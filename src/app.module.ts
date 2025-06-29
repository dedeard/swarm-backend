import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AgentCategoriesModule } from './agent-categories/agent-categories.module';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ModeGuard } from './common/guards/mode.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { RoleGuard } from './common/guards/role.guard';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { CompaniesModule } from './companies/companies.module';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
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
    ThrottlerModule.forRoot([
      {
        ttl: 60, // Time-to-live in seconds
        limit: 100, // Number of requests allowed within TTL
      },
    ]),
    PrismaModule,
    AgentsModule,
    AuthModule,
    CompaniesModule,
    AgentCategoriesModule,
    ToolsModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ModeGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
