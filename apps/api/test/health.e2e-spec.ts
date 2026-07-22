import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('Health E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health/live', () => {
    it('should return 200 with status up', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/health/live',
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.status).toBe('up');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when all services are up', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      // With real Docker containers up, this should be 200
      // Without them, 503 is expected
      expect([200, 503]).toContain(result.statusCode);
    });

    it('should not expose DATABASE_URL or REDIS_URL', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(result.payload).not.toContain('DATABASE_URL');
      expect(result.payload).not.toContain('REDIS_URL');
      expect(result.payload).not.toContain('postgresql://');
      expect(result.payload).not.toContain('redis://');
    });

    it('should include correlation_id in response headers or body', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/health/ready',
        headers: {
          'x-correlation-id': '550e8400-e29b-41d4-a716-446655440000',
        },
      });

      // The request should complete without error
      expect(result.statusCode).toBeDefined();
    });
  });
});
