import { RedisService } from './redis.service';
export declare class RedisRateLimiterService {
    private readonly redis;
    constructor(redis: RedisService);
    checkLimit(type: 'ip' | 'email', rawIdentifier: string, limit: number, windowSecs: number): Promise<boolean>;
}
