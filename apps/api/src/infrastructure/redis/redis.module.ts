import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisRateLimiterService } from './redis-rate-limiter.service';

@Global()
@Module({
  providers: [RedisService, RedisRateLimiterService],
  exports: [RedisService, RedisRateLimiterService],
})
export class RedisModule {}
