import { HealthCheckService } from '@nestjs/terminus';
import { PostgresHealthIndicator } from './indicators/postgres.health';
import { RedisHealthIndicator } from './indicators/redis.health';
export declare class HealthController {
    private health;
    private postgresIndicator;
    private redisIndicator;
    constructor(health: HealthCheckService, postgresIndicator: PostgresHealthIndicator, redisIndicator: RedisHealthIndicator);
    getLiveness(): {
        status: string;
        timestamp: string;
    };
    getReadiness(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
