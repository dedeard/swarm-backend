import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static instance: PrismaService;
  private isConnected: boolean = false;

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Reuse connection in Lambda environment
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      if (!PrismaService.instance) {
        PrismaService.instance = this;
      }
      return PrismaService.instance;
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.$connect();
        this.isConnected = true;
        console.log('Successfully connected to the database');
      } catch (error) {
        console.error('Failed to connect to the database:', error);
        throw error;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Only disconnect if not running in Lambda
    if (!process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      await this.$disconnect();
      this.isConnected = false;
    }
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
