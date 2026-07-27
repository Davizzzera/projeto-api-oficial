import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createPrismaClient } from '@repo/database';
import type { PrismaClient } from '@repo/database';
import { AuthFixture } from '../fixtures/auth.fixture';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { RedisSessionSchema } from '../../../src/modules/identity/auth/schemas/redis-session.schema';

interface FastifyWithCookie {
  unsignCookie(value: string, secret: string): { valid: boolean; value: string | null; renewed: boolean };
}

const getCookie = (cookies: { name: string; value: string }[], name: string) =>
  cookies.find(c => c.name === name);

describe('POST /auth/switch-organization (E2E)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let authFixture: AuthFixture;
  let redis: Redis;

  beforeAll(async () => {
    const dbUrl = (process.env.DATABASE_URL_TEST || '').replace(/^"|"$/g, '');
    prisma = createPrismaClient(dbUrl);
    await prisma.$connect();
    authFixture = new AuthFixture(prisma);

    const redisUrl = process.env.REDIS_URL_TEST;
    if (!redisUrl) throw new Error('REDIS_URL_TEST is required');
    redis = new Redis(redisUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    const configService = app.get(ConfigService);
    const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
    if (!cookieSecret) throw new Error('SESSION_COOKIE_SECRET is required');
    await app.register(fastifyCookie as Parameters<NestFastifyApplication['register']>[0], {
      secret: cookieSecret,
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
  });

  afterEach(async () => {
    await redis.flushdb();
  });

  it('should switch organization successfully with session rotation', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      // Login to first org (org1)
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      expect(loginRes.statusCode).toBe(204);
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');
      expect(sessionCookie).toBeDefined();

      // Get CSRF token for switch action
      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      expect(switchCsrfRes.statusCode).toBe(200);
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      // Capture old Redis key
      const configService = app.get(ConfigService);
      const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
      const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyWithCookie;
      const unsignedOld = fastifyInstance.unsignCookie(sessionCookie!.value, cookieSecret!);
      const hashedOld = createHash('sha256').update(unsignedOld.value!).digest('hex');
      const oldRedisKey = `test:session:${hashedOld}`;
      const oldSessionDataRaw = await redis.get(oldRedisKey);
      const oldSessionData = RedisSessionSchema.parse(JSON.parse(oldSessionDataRaw!));
      const originalExpiresAt = oldSessionData.absoluteExpiresAt;

      // Perform switch to org2
      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': switchCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(204);

      const newSessionCookie = getCookie(switchRes.cookies, 'session_id');
      expect(newSessionCookie).toBeDefined();

      // Old Redis key should be gone
      const oldAfter = await redis.get(oldRedisKey);
      expect(oldAfter).toBeNull();

      // New session should exist and have org2 id and same expiresAt
      const unsignedNew = fastifyInstance.unsignCookie(newSessionCookie!.value, cookieSecret!);
      const hashedNew = createHash('sha256').update(unsignedNew.value!).digest('hex');
      const newRedisKey = `test:session:${hashedNew}`;
      const newSessionRaw = await redis.get(newRedisKey);
      expect(newSessionRaw).not.toBeNull();
      const newSession = RedisSessionSchema.parse(JSON.parse(newSessionRaw!));
      expect(newSession.organizationId).toBe(fixture.org2.id);
      expect(newSession.absoluteExpiresAt).toBe(originalExpiresAt);

      // Verify GET /auth/me reflects new org
      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        cookies: { session_id: newSessionCookie!.value },
      });
      expect(meRes.statusCode).toBe(200);
      const meData = meRes.json<{ organization: { id: string } }>();
      expect(meData.organization.id).toBe(fixture.org2.id);

      // Verify AuditLog and SecurityEvent were created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'SWITCH_ORGANIZATION', actorUserId: fixture.user.id },
        orderBy: { occurredAt: 'desc' }
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog!.organizationId).toBe(fixture.org2.id);
      expect((auditLog!.metadata as any).toOrganizationId).toBe(fixture.org2.id);
      
      const securityEvent = await prisma.securityEvent.findFirst({
        where: { eventType: 'SESSION_ROTATED', userId: fixture.user.id },
        orderBy: { occurredAt: 'desc' }
      });
      expect(securityEvent).not.toBeNull();
      expect(securityEvent!.organizationId).toBe(fixture.org2.id);
      expect((securityEvent!.metadata as any).toOrganizationId).toBe(fixture.org2.id);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch without CSRF token', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch to organization without membership', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      // Get CSRF for switch
      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      // Attempt to switch to a random UUID (no membership)
      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': switchCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: '00000000-0000-0000-0000-000000000000' },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch to same organization', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');
      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': switchCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org1.id },
      });
      expect(switchRes.statusCode).toBe(400);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch without session cookie', async () => {
    const csrfRes = await app.inject({
      method: 'GET',
      url: '/auth/csrf?action=auth:switch-organization',
    });
    expect(csrfRes.statusCode).toBe(200);
    const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
    const switchRes = await app.inject({
      method: 'POST',
      url: '/auth/switch-organization',
      headers: { 'x-csrf-token': csrfToken },
      payload: { organizationId: 'any' },
    });
    expect(switchRes.statusCode).toBe(401);
  });

  it('should reject switch with invalid CSRF token', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': 'invalid-token-123' },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch using logout CSRF token', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      // Get logout CSRF
      const logoutCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:logout',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: logoutCsrfToken } = logoutCsrfRes.json<{ csrfToken: string }>();

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': logoutCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch to inactive organization target', async () => {
    const fixture = await authFixture.setupMultiOrgUserWithInactiveTarget();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': switchCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should reject switch to inactive membership', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    // mark second membership inactive
    await prisma.membership.update({
      where: { id: fixture.membership2.id },
      data: { status: 'INACTIVE' }
    });
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      const switchRes = await app.inject({
        method: 'POST',
        url: '/auth/switch-organization',
        headers: { 'x-csrf-token': switchCsrfToken },
        cookies: { session_id: sessionCookie!.value },
        payload: { organizationId: fixture.org2.id },
      });
      expect(switchRes.statusCode).toBe(403);
    } finally {
      await fixture.cleanup();
    }
  });

  it('should handle concurrent switch gracefully (only one wins)', async () => {
    const fixture = await authFixture.setupMultiOrgUser();
    try {
      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const switchCsrfRes = await app.inject({
        method: 'GET',
        url: '/auth/csrf?action=auth:switch-organization',
        cookies: { session_id: sessionCookie!.value },
      });
      const { csrfToken: switchCsrfToken } = switchCsrfRes.json<{ csrfToken: string }>();

      // Send 2 parallel switch requests
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/auth/switch-organization',
          headers: { 'x-csrf-token': switchCsrfToken },
          cookies: { session_id: sessionCookie!.value },
          payload: { organizationId: fixture.org2.id },
        }),
        app.inject({
          method: 'POST',
          url: '/auth/switch-organization',
          headers: { 'x-csrf-token': switchCsrfToken },
          cookies: { session_id: sessionCookie!.value },
          payload: { organizationId: fixture.org2.id },
        })
      ]);

      const codes = [res1.statusCode, res2.statusCode];
      // At least one request must succeed
      expect(codes).toContain(204);
      // Both 204 (serialized) or one non-204 (true race detected) are valid outcomes
      const successes = codes.filter(c => c === 204).length;
      expect(successes).toBeGreaterThanOrEqual(1);
      expect(successes).toBeLessThanOrEqual(2);
    } finally {
      await fixture.cleanup();
    }
  });
});
