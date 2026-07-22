import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { DatabaseService } from '../../infrastructure/database/database.service';
export declare class PostgresHealthIndicator extends HealthIndicator {
    private readonly dbService;
    constructor(dbService: DatabaseService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
