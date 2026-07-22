import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PostgresHealthIndicator } from './indicators/postgres.health';
import { RedisHealthIndicator } from './indicators/redis.health';

import { Test, TestingModule } from '@nestjs/testing';

describe('HealthController', () => {
  let controller: HealthController;
  let mockCheck: ReturnType<typeof vi.fn>;
  let mockPgIsHealthy: ReturnType<typeof vi.fn>;
  let mockRedisIsHealthy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockCheck = vi.fn();
    mockPgIsHealthy = vi.fn();
    mockRedisIsHealthy = vi.fn();

    controller = new HealthController(
      { check: mockCheck } as any,
      { isHealthy: mockPgIsHealthy } as any,
      { isHealthy: mockRedisIsHealthy } as any,
    );
  });

  describe('GET /health/live', () => {
    it('should return status up', () => {
      const result = controller.getLiveness();
      expect(result.status).toBe('up');
      expect(result.timestamp).toBeDefined();
    });

    it('should not depend on database or redis', () => {
      const result = controller.getLiveness();
      expect(mockPgIsHealthy).not.toHaveBeenCalled();
      expect(mockRedisIsHealthy).not.toHaveBeenCalled();
      expect(result.status).toBe('up');
    });
  });

  describe('GET /health/ready', () => {
    it('should call health check service with indicators', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {
          postgres: { status: 'up', message: 'Database connection is stable' },
          redis: { status: 'up', message: 'Redis connection is stable' },
        },
        error: {},
        details: {
          postgres: { status: 'up', message: 'Database connection is stable' },
          redis: { status: 'up', message: 'Redis connection is stable' },
        },
      };

      mockCheck.mockResolvedValue(mockResult);

      const result = await controller.getReadiness();
      expect(mockCheck).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    it('should not expose connection strings in response', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {
          postgres: { status: 'up', message: 'Database connection is stable' },
          redis: { status: 'up', message: 'Redis connection is stable' },
        },
        error: {},
        details: {
          postgres: { status: 'up', message: 'Database connection is stable' },
          redis: { status: 'up', message: 'Redis connection is stable' },
        },
      };

      mockCheck.mockResolvedValue(mockResult);

      const result = await controller.getReadiness();
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('postgresql://');
      expect(serialized).not.toContain('redis://');
      expect(serialized).not.toContain('DATABASE_URL');
      expect(serialized).not.toContain('REDIS_URL');
    });

    it('should throw ServiceUnavailableException when health check fails', async () => {
      mockCheck.mockRejectedValue(new Error('Health check failed'));

      await expect(controller.getReadiness()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
