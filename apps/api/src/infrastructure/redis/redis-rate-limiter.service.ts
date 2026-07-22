import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createHash } from 'crypto';

@Injectable()
export class RedisRateLimiterService {
  constructor(private readonly redis: RedisService) {}

  async checkLimit(type: 'ip' | 'email', rawIdentifier: string, limit: number, windowSecs: number): Promise<boolean> {
    const identifier = createHash('sha256').update(rawIdentifier).digest('hex');
    const key = `ratelimit:${type}:${identifier}`;
    
    // Using multi to ensure atomicity
    const multi = this.redis.multi();
    multi.incr(key);
    multi.ttl(key);
    
    const results = await multi.exec();
    if (!results) return false;
    
    const currentCount = results[0][1] as number;
    const ttl = results[1][1] as number;
    
    if (currentCount === 1 || ttl === -1) {
      await this.redis.expire(key, windowSecs);
    }
    
    return currentCount <= limit;
  }
}
