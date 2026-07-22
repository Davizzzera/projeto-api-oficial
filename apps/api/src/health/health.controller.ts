import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PostgresHealthIndicator } from './indicators/postgres.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private postgresIndicator: PostgresHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Serviço está ativo.' })
  getLiveness() {
    return { status: 'up', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Serviço pronto para receber tráfego.' })
  @ApiResponse({ status: 503, description: 'Dependências indisponíveis.' })
  async getReadiness() {
    try {
      return await this.health.check([
        () => this.postgresIndicator.isHealthy('postgres'),
        () => this.redisIndicator.isHealthy('redis'),
      ]);
    } catch (e) {
      throw new ServiceUnavailableException(e);
    }
  }
}
