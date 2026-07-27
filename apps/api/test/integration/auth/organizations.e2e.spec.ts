import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createPrismaClient } from '@repo/database';
import type { PrismaClient } from '@repo/database';
import { AuthFixture } from '../fixtures/auth.fixture';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

describe('GET /auth/organizations (E2E)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let authFixture: AuthFixture;
  let redis: Redis;

  const getCookie = (cookies: { name: string; value: string }[], name: string) =>
    cookies.find(c => c.name === name);

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

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
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

  it('should return organizations for authenticated user with isCurrent flag', async () => {
    let fixture: any;
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
        payload: { email: fixture.email, password: fixture.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const orgRes = await app.inject({
        method: 'GET',
        url: '/auth/organizations',
        cookies: { session_id: sessionCookie!.value },
      });

      expect(orgRes.statusCode).toBe(200);
      const data = orgRes.json<Array<any>>();
      expect(Array.isArray(data)).toBe(true);
      const currentOrg = data.find(o => o.id === fixture.org.id);
      expect(currentOrg).toBeDefined();
      expect(currentOrg.isCurrent).toBe(true);
      expect(currentOrg.name).toBe(fixture.org.name);
      expect(currentOrg.slug).toBe(fixture.org.slug);
      expect(currentOrg.roleCode).toBe(fixture.role.code);
      // No sensitive data
      expect(currentOrg.status).toBeUndefined();
      expect(currentOrg.deletedAt).toBeUndefined();
    } finally {
      if (fixture) await fixture.cleanup();
    }
  });

  it('should return 401 without session cookie', async () => {
    const orgRes = await app.inject({ method: 'GET', url: '/auth/organizations' });
    expect(orgRes.statusCode).toBe(401);
  });

  it('should not include inactive organizations', async () => {
    let fixture: any;
    try {
      fixture = await authFixture.setupMultiOrgUser();
      await prisma.organization.update({
        where: { id: fixture.org2.id },
        data: { status: 'INACTIVE' }
      });
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

      const orgRes = await app.inject({
        method: 'GET',
        url: '/auth/organizations',
        cookies: { session_id: sessionCookie!.value },
      });
      expect(orgRes.statusCode).toBe(200);
      const data = orgRes.json<Array<any>>();
      const inactive = data.find(o => o.id === fixture.org2.id);
      expect(inactive).toBeUndefined();
    } finally {
      if (fixture) await fixture.cleanup();
    }
  });

  it('should not include inactive memberships', async () => {
    let fixture: any;
    try {
      fixture = await authFixture.setupMultiOrgUser();
      await prisma.membership.update({
        where: { id: fixture.membership2.id },
        data: { status: 'INACTIVE' }
      });
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

      const orgRes = await app.inject({
        method: 'GET',
        url: '/auth/organizations',
        cookies: { session_id: sessionCookie!.value },
      });
      expect(orgRes.statusCode).toBe(200);
      const data = orgRes.json<Array<any>>();
      const inactiveMem = data.find(o => o.id === fixture.org2.id);
      expect(inactiveMem).toBeUndefined();
    } finally {
      if (fixture) await fixture.cleanup();
    }
  });

  it('should not include soft-deleted organizations', async () => {
    let fixture: any;
    try {
      fixture = await authFixture.setupMultiOrgUser();
      await prisma.organization.update({
        where: { id: fixture.org2.id },
        data: { deletedAt: new Date() }
      });
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

      const orgRes = await app.inject({
        method: 'GET',
        url: '/auth/organizations',
        cookies: { session_id: sessionCookie!.value },
      });
      expect(orgRes.statusCode).toBe(200);
      const data = orgRes.json<Array<any>>();
      const deleted = data.find(o => o.id === fixture.org2.id);
      expect(deleted).toBeUndefined();
    } finally {
      if (fixture) await fixture.cleanup();
    }
  });

  it('should not include organizations of other users', async () => {
    let fixture1: any;
    let fixture2: any;
    try {
      fixture1 = await authFixture.setupActiveUser();
      fixture2 = await authFixture.setupActiveUser();

      const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf' });
      const { csrfToken } = csrfRes.json<{ csrfToken: string }>();
      const preauthCookie = getCookie(csrfRes.cookies, 'preauth_session');

      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-csrf-token': csrfToken },
        cookies: { preauth_session: preauthCookie!.value },
        payload: { email: fixture1.email, password: fixture1.password },
      });
      const sessionCookie = getCookie(loginRes.cookies, 'session_id');

      const orgRes = await app.inject({
        method: 'GET',
        url: '/auth/organizations',
        cookies: { session_id: sessionCookie!.value },
      });
      expect(orgRes.statusCode).toBe(200);
      const data = orgRes.json<Array<any>>();
      
      const otherOrg = data.find(o => o.id === fixture2.org.id);
      expect(otherOrg).toBeUndefined();
    } finally {
      if (fixture1) await fixture1.cleanup();
      if (fixture2) await fixture2.cleanup();
    }
  });
});
