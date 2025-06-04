import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this?.$connect?.();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  cleanDatabase(): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Add logic here to clean the database for testing purposes
    // This is useful for e2e tests
    // Example: this.user.deleteMany();
  }
}
