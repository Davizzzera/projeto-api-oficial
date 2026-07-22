import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const isTest = configService.get<string>('NODE_ENV') === 'test';
    const redisUrl = isTest 
      ? configService.get<string>('REDIS_URL_TEST') || configService.get<string>('REDIS_URL')
      : configService.get<string>('REDIS_URL');

    super(redisUrl!, {
      keyPrefix: isTest ? 'test:' : '',
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.connect().catch(() => {
      // Connection errors are handled by the health check
    });
  }

  async flushall(...args: any[]) {
    const isTest = this.options.keyPrefix === 'test:';
    if (!isTest) {
      throw new Error('FLUSHALL is strictly forbidden outside of test environment.');
    }
    return super.flushall(...args as any);
  }

  async onModuleDestroy() {
    await this.quit();
  }

  async healthPing(): Promise<string> {
    return super.ping();
  }
}
