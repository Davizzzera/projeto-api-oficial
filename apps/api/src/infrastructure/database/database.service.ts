import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient, PrismaClient } from '@repo/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    this.client = createPrismaClient(databaseUrl!);
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  async $queryRawUnsafe(query: string): Promise<unknown> {
    return this.client.$queryRawUnsafe(query);
  }

  getClient(): PrismaClient {
    return this.client;
  }
}
