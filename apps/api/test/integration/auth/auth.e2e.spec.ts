import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPrismaClient, PrismaClient } from '@repo/database';
import { AuthFixture } from '../fixtures/auth.fixture';
import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { RedisSessionSchema } from '../../../src/modules/identity/auth/schemas/redis-session.schema';

interface FastifyWithCookie {
  unsignCookie(value: string, secret: string): { valid: boolean; value: string | null; renewed: boolean };
}

describe('Auth Integration (E2E)', () => {
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

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    const configService = app.get(ConfigService);
    
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    // Reusing the same cookie secret as the real app to allow signing/unsigning
    const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
    if (!cookieSecret) throw new Error('SESSION_COOKIE_SECRET is required');

    await app.register(fastifyCookie as Parameters<NestFastifyApplication['register']>[0], { 
      secret: cookieSecret 
    });
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
  });

  const getCookie = (cookies: { name: string, value: string }[], name: string) => {
    return cookies.find(c => c.name === name);
  };

  describe('Login Flow', () => {
    it('should login successfully and set cookie', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        // 1. Get CSRF token and preauth_session
        const csrfRes = await app.inject({
          method: 'GET',
          url: '/auth/csrf'
        });
        expect(csrfRes.statusCode).toBe(200);
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');
        expect(preauthCookie).toBeDefined();

        // 2. Login
        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        expect(loginRes.statusCode).toBe(204);
        const sessionCookie = getCookie(loginRes.cookies, 'session_id');
        expect(sessionCookie).toBeDefined();

        // Direct Redis Validation
        const configService = app.get(ConfigService);
        const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
        const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyWithCookie;
        
        const unsigned = fastifyInstance.unsignCookie(sessionCookie!.value, cookieSecret!);
        expect(unsigned.valid).toBe(true);
        expect(unsigned.value).not.toBeNull();
        
        const rawSessionId = unsigned.value!;
        const hashedSessionId = createHash('sha256').update(rawSessionId).digest('hex');
        
        // Use test: prefix as configured in RedisService
        const redisKey = `test:session:${hashedSessionId}`;
        const sessionInRedis = await redis.get(redisKey);
        expect(sessionInRedis).not.toBeNull();
        
        const parsedSession = JSON.parse(sessionInRedis!);
        const validatedSession = RedisSessionSchema.parse(parsedSession);
        
        expect(validatedSession.userId).toBe(fixture.user.id);
        expect(validatedSession.membershipId).toBe(fixture.membership.id);
        expect(validatedSession.organizationId).toBe(fixture.org.id);
        
        const rawKeyExists = await redis.exists(`test:session:${rawSessionId}`);
        expect(rawKeyExists).toBe(0);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });

    it('should fail if nonce is reused', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes1 = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });
        expect(loginRes1.statusCode).toBe(204);

        const loginRes2 = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });
        expect(loginRes2.statusCode).toBe(403);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });

    it('should fail with incorrect password', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: 'wrongpassword' }
        });

        expect(loginRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });

    it('should fail for inactive user', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupInactiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        expect(loginRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
    
    it('should fail for soft-deleted user', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupDeletedUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        expect(loginRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
    
    it('should fail for inactive membership', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupInactiveMembership();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        expect(loginRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });

    it('should fail for inactive organization', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupInactiveOrganization();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        expect(loginRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
  });

  describe('Session validation (GET /auth/me)', () => {
    it('should return user data for valid session', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        const sessionCookie = getCookie(loginRes.cookies, 'session_id');

        const meRes = await app.inject({
          method: 'GET',
          url: '/auth/me',
          cookies: { session_id: sessionCookie!.value }
        });

        expect(meRes.statusCode).toBe(200);
        const data = meRes.json<{ user: Record<string, unknown>, organization: Record<string, unknown>, membership: Record<string, unknown> }>();
        expect(data.user.email).toBe(fixture.email);
        expect(data.organization.id).toBe(fixture.org.id);
        expect(data.membership).toBeDefined();
        
        // Redis validation is handled internally by the session manager.
        // As long as /auth/me returns 200, the session is working and in Redis.
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
    
    it('should return 401 for diverging sessionVersion', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        const sessionCookie = getCookie(loginRes.cookies, 'session_id');

        // manually update sessionVersion in DB
        await prisma.user.update({
          where: { id: fixture.user.id },
          data: { sessionVersion: 2 }
        });

        const meRes = await app.inject({
          method: 'GET',
          url: '/auth/me',
          cookies: { session_id: sessionCookie!.value }
        });

        expect(meRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
    
    it('should return 401 for diverging organizationId', async () => {
      let fixture;
      let otherOrg;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        const sessionCookie = getCookie(loginRes.cookies, 'session_id');

        // Extract session ID and modify Redis data directly
        const configService = app.get(ConfigService);
        const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
        const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyWithCookie;
        
        const unsigned = fastifyInstance.unsignCookie(sessionCookie!.value, cookieSecret!);
        const rawSessionId = unsigned.value!;
        const hashedSessionId = createHash('sha256').update(rawSessionId).digest('hex');
        
        const redisKey = `test:session:${hashedSessionId}`;
        const sessionDataStr = await redis.get(redisKey);
        const sessionData = JSON.parse(sessionDataStr!);
        
        otherOrg = await authFixture.setupActiveUser();
        
        sessionData.organizationId = otherOrg.org.id;
        await redis.set(redisKey, JSON.stringify(sessionData));

        const meRes = await app.inject({
          method: 'GET',
          url: '/auth/me',
          cookies: { session_id: sessionCookie!.value }
        });

        expect(meRes.statusCode).toBe(401);
        
        // Assert session is invalidated (deleted from Redis)
        const invalidatedSession = await redis.get(redisKey);
        expect(invalidatedSession).toBeNull();
      } finally {
        if (fixture) await fixture.cleanup();
        if (otherOrg) await otherOrg.cleanup();
      }
    });

    it('should return 401 if session cookie is missing', async () => {
      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me'
      });
      expect(meRes.statusCode).toBe(401);
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully with CSRF token', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        const sessionCookie = getCookie(loginRes.cookies, 'session_id');

        const authCsrfRes = await app.inject({
          method: 'GET',
          url: '/auth/csrf',
          cookies: { session_id: sessionCookie!.value }
        });

        expect(authCsrfRes.statusCode).toBe(200);
        const { csrfToken: authCsrfToken } = authCsrfRes.json<{ csrfToken: string }>();

        // 2. Verify Redis key exists before logout
        const configService = app.get(ConfigService);
        const cookieSecret = configService.get<string>('SESSION_COOKIE_SECRET');
        const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyWithCookie;
        const unsigned = fastifyInstance.unsignCookie(sessionCookie!.value, cookieSecret!);
        const hashedSessionId = createHash('sha256').update(unsigned.value!).digest('hex');
        const redisKey = `test:session:${hashedSessionId}`;
        
        const sessionBeforeLogout = await redis.get(redisKey);
        expect(sessionBeforeLogout).not.toBeNull();

        // 3. Logout
        const logoutRes = await app.inject({
          method: 'POST',
          url: '/auth/logout',
          cookies: { session_id: sessionCookie!.value },
          headers: { 'x-csrf-token': authCsrfToken }
        });

        expect(logoutRes.statusCode).toBe(204);
        
        // Session removed check via Set-Cookie
        const clearedSessionCookie = getCookie(logoutRes.cookies, 'session_id');
        expect(clearedSessionCookie).toBeDefined();
        expect(clearedSessionCookie!.value).toBe('');
        
        // 4. Verify session is physically removed from Redis
        const sessionAfterLogout = await redis.get(redisKey);
        expect(sessionAfterLogout).toBeNull();

        // Verify session is invalidated via GET /auth/me
        const meRes = await app.inject({
          method: 'GET',
          url: '/auth/me',
          cookies: { session_id: sessionCookie!.value }
        });
        expect(meRes.statusCode).toBe(401);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });

    it('should fail logout without CSRF token', async () => {
      let fixture;
      try {
        fixture = await authFixture.setupActiveUser();

        const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
        const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
        const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

        const loginRes = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'x-csrf-token': csrfToken },
          cookies: { preauth_session: preauthCookie!.value },
          payload: { email: fixture.email, password: fixture.password }
        });

        const sessionCookie = getCookie(loginRes.cookies, 'session_id');

        const logoutRes = await app.inject({
          method: 'POST',
          url: '/auth/logout',
          cookies: { session_id: sessionCookie!.value }
        });

        expect(logoutRes.statusCode).toBe(403);
      } finally {
        if (fixture) await fixture.cleanup();
      }
    });
  });
});
