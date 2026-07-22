import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPrismaClient } from '@repo/database';
import { AuthFixture } from '../fixtures/auth.fixture';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';

describe('Auth Integration (E2E)', () => {
  let app: NestFastifyApplication;
  let prisma: any;
  let authFixture: AuthFixture;

  beforeAll(async () => {
    const dbUrl = (process.env.DATABASE_URL_TEST || '').replace(/^"|"$/g, '');
    prisma = createPrismaClient(dbUrl);
    await prisma.$connect();
    authFixture = new AuthFixture(prisma);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.register(cookie as never, { secret: 'test-cookie-secret' });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Login Flow', () => {
    it('should fail without CSRF token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@test.com', password: 'Password123!' }
      });
      expect(response.statusCode).toBe(403);
    });

    it('should login successfully and set cookie', async () => {
      const fixture = await authFixture.setupActiveUser();

      // 1. Get Pre-auth nonce
      const nonceRes = await app.inject({
        method: 'GET',
        url: '/api/auth/nonce'
      });
      expect(nonceRes.statusCode).toBe(200);
      const { nonce } = nonceRes.json();

      // 2. Login
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: fixture.password }
      });

      expect(loginRes.statusCode).toBe(200);
      const cookies = loginRes.cookies;
      const sessionCookie = cookies.find((c: any) => c.name === 'sessionId');
      expect(sessionCookie).toBeDefined();

      await fixture.cleanup();
    });

    it('should fail with incorrect password', async () => {
      const fixture = await authFixture.setupActiveUser();

      const nonceRes = await app.inject({ method: 'GET', url: '/api/auth/nonce' });
      const { nonce } = nonceRes.json();

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: 'wrongpassword' }
      });

      expect(loginRes.statusCode).toBe(401);

      await fixture.cleanup();
    });

    it('should fail for inactive user', async () => {
      const fixture = await authFixture.setupInactiveUser();

      const nonceRes = await app.inject({ method: 'GET', url: '/api/auth/nonce' });
      const { nonce } = nonceRes.json();

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: fixture.password }
      });

      expect(loginRes.statusCode).toBe(401);

      await fixture.cleanup();
    });
  });

  describe('Session validation (GET /auth/me)', () => {
    it('should return user data for valid session', async () => {
      const fixture = await authFixture.setupActiveUser();

      const nonceRes = await app.inject({ method: 'GET', url: '/api/auth/nonce' });
      const { nonce } = nonceRes.json();

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: fixture.password }
      });

      const sessionCookie = loginRes.cookies.find((c: any) => c.name === 'sessionId');

      const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: { sessionId: sessionCookie.value }
      });

      expect(meRes.statusCode).toBe(200);
      const data = meRes.json();
      expect(data.user.email).toBe(fixture.email);
      expect(data.organization.id).toBe(fixture.org.id);

      await fixture.cleanup();
    });

    it('should return 401 if session cookie is missing', async () => {
      const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me'
      });
      expect(meRes.statusCode).toBe(401);
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully with CSRF token', async () => {
      const fixture = await authFixture.setupActiveUser();

      const nonceRes = await app.inject({ method: 'GET', url: '/api/auth/nonce' });
      const { nonce } = nonceRes.json();

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: fixture.password }
      });

      const sessionCookie = loginRes.cookies.find((c: any) => c.name === 'sessionId');

      const csrfRes = await app.inject({
        method: 'GET',
        url: '/api/auth/csrf',
        cookies: { sessionId: sessionCookie.value }
      });

      expect(csrfRes.statusCode).toBe(200);
      const { csrfToken } = csrfRes.json();

      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        cookies: { sessionId: sessionCookie.value },
        headers: { 'x-csrf-token': csrfToken }
      });

      expect(logoutRes.statusCode).toBe(204);

      // Verify session is invalidated
      const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: { sessionId: sessionCookie.value }
      });
      expect(meRes.statusCode).toBe(401);

      await fixture.cleanup();
    });

    it('should fail logout without CSRF token', async () => {
      const fixture = await authFixture.setupActiveUser();

      const nonceRes = await app.inject({ method: 'GET', url: '/api/auth/nonce' });
      const { nonce } = nonceRes.json();

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-preauth-nonce': nonce },
        payload: { email: fixture.email, password: fixture.password }
      });

      const sessionCookie = loginRes.cookies.find((c: any) => c.name === 'sessionId');

      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        cookies: { sessionId: sessionCookie.value }
      });

      expect(logoutRes.statusCode).toBe(403);

      await fixture.cleanup();
    });
  });
});
