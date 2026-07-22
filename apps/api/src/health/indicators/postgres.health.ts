import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(private readonly dbService: DatabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dbService.$queryRawUnsafe('SELECT 1');
      return this.getStatus(key, true, { message: 'Database connection is stable' });
    } catch (error) {
      throw new HealthCheckError(
        'Postgres check failed',
        this.getStatus(key, false, { message: 'Database connection failed' }),
      );
    }
  }
}
