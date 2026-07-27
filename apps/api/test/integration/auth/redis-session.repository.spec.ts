import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { RedisSessionRepository } from '../../../src/modules/identity/auth/repositories/redis-session.repository';
import { RedisService } from '../../../src/infrastructure/redis/redis.service';
import { ConflictException } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

describe('RedisSessionRepository (Integration)', () => {
  let repository: RedisSessionRepository;
  let redisService: RedisService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repository = moduleRef.get(RedisSessionRepository);
    redisService = moduleRef.get(RedisService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  afterEach(async () => {
    await redisService.flushdb();
  });

  it('should allow exactly one session rotation concurrently', async () => {
    const currentSessionKey = 'session:old_hash_123';
    
    const mockSession = {
      userId: '00000000-0000-0000-0000-000000000001',
      membershipId: '00000000-0000-0000-0000-000000000002',
      organizationId: '00000000-0000-0000-0000-000000000003',
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      absoluteExpiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      userAgent: 'test',
      csrfSecret: 'secret123'
    };
    
    await redisService.set(currentSessionKey, JSON.stringify(mockSession));

    const targetMembershipId = '00000000-0000-0000-0000-000000000004';
    const targetOrganizationId = '00000000-0000-0000-0000-000000000005';
    const sessionVersion = 1;

    // Both calls start exactly simultaneously
    const results = await Promise.allSettled([
      repository.rotateSession(currentSessionKey, targetMembershipId, targetOrganizationId, sessionVersion),
      repository.rotateSession(currentSessionKey, targetMembershipId, targetOrganizationId, sessionVersion)
    ]);

    let successCount = 0;
    let conflictCount = 0;
    let nullCount = 0;

    for (const res of results) {
      if (res.status === 'fulfilled') {
        if (res.value !== null) {
          successCount++;
        } else {
          nullCount++;
        }
      } else if (res.status === 'rejected' && res.reason instanceof ConflictException) {
        conflictCount++;
      } else {
        throw res.status === 'rejected' ? res.reason : new Error('Unexpected fulfillment');
      }
    }

    expect(successCount).toBe(1);
    expect(conflictCount + nullCount).toBe(1);

    const oldAfter = await redisService.get(currentSessionKey);
    expect(oldAfter).toBeNull();
  });
});
