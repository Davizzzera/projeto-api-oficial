import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { verifyPassword } from '@repo/security';
import { RedisSession, RedisSessionSchema } from './schemas/redis-session.schema';
import { AuthPrincipal } from '../../../common/types/auth-principal';


@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly database: DatabaseService,
    private readonly config: ConfigService
  ) {}

  async generatePreAuthNonce(): Promise<string> {
    const nonce = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(nonce).digest('hex');
    await this.redis.setex(`preauth:${hash}`, 10 * 60, '1');
    return nonce;
  }

  async consumePreAuthNonce(nonce: string): Promise<boolean> {
    const hash = createHash('sha256').update(nonce).digest('hex');
    const result = await this.redis.del(`preauth:${hash}`);
    return result > 0;
  }

  async validateCredentials(email: string, password: string): Promise<{ userId: string, membershipId: string, organizationId: string, sessionVersion: number } | null> {
    const prisma = this.database.getClient();
    
    const user = await prisma.user.findFirst({
      where: { 
        emailNormalized: email.toLowerCase(),
        status: 'ACTIVE',
        deletedAt: null
      },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            organization: {
              status: 'ACTIVE',
              deletedAt: null
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return null;
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (isValid) {
      return { 
        userId: user.id, 
        membershipId: user.memberships[0].id, 
        organizationId: user.memberships[0].organizationId,
        sessionVersion: user.sessionVersion
      };
    }
    return null;
  }

  async createSession(
    userId: string,
    membershipId: string,
    organizationId: string,
    sessionVersion: number,
    userAgent: string
  ): Promise<{ sessionId: string, maxAge: number }> {
    const sessionId = randomBytes(64).toString('hex');
    const hash = createHash('sha256').update(sessionId).digest('hex');
    
    const absoluteMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const idleTimeout = 30 * 60; // 30 minutes idle timeout

    const nowStr = new Date().toISOString();
    const absoluteExpiresAt = new Date(Date.now() + absoluteMaxAge * 1000).toISOString();
    
    const sessionData: RedisSession = {
      userId,
      membershipId,
      organizationId,
      sessionVersion,
      createdAt: nowStr,
      lastActivityAt: nowStr,
      absoluteExpiresAt,
      userAgent: userAgent || null,
      csrfSecret: randomBytes(32).toString('hex') 
    };

    await this.redis.setex(`session:${hash}`, idleTimeout, JSON.stringify(sessionData));
    
    return { sessionId, maxAge: absoluteMaxAge };
  }

  async getSession(sessionId: string): Promise<RedisSession | null> {
    const hash = createHash('sha256').update(sessionId).digest('hex');
    const dataStr = await this.redis.get(`session:${hash}`);
    
    if (!dataStr) return null;
    
    let sessionData: RedisSession;
    try {
      sessionData = RedisSessionSchema.parse(JSON.parse(dataStr));
    } catch {
      return null;
    }
    
    const now = new Date();
    const absExp = new Date(sessionData.absoluteExpiresAt);
    if (now >= absExp) {
      await this.redis.del(`session:${hash}`);
      return null;
    }
    
    sessionData.lastActivityAt = now.toISOString();
    
    const absoluteRemainingSecs = Math.floor((absExp.getTime() - now.getTime()) / 1000);
    const idleTimeout = 30 * 60;
    
    const newTtl = Math.min(idleTimeout, absoluteRemainingSecs);
    if (newTtl > 0) {
      await this.redis.setex(`session:${hash}`, newTtl, JSON.stringify(sessionData));
    } else {
      await this.redis.del(`session:${hash}`);
      return null;
    }
    
    return sessionData;
  }

  async destroySession(sessionId: string): Promise<void> {
    const hash = createHash('sha256').update(sessionId).digest('hex');
    await this.redis.del(`session:${hash}`);
  }

  async getSessionByKey(authSessionKey: string): Promise<RedisSession | null> {
    const dataStr = await this.redis.get(authSessionKey);
    if (!dataStr) return null;
    try {
      return RedisSessionSchema.parse(JSON.parse(dataStr));
    } catch {
      return null;
    }
  }

  async destroySessionByKey(authSessionKey: string): Promise<void> {
    await this.redis.del(authSessionKey);
  }

  async getMeData(auth: AuthPrincipal) {
    const prisma = this.database.getClient();
    
    const user = await prisma.user.findFirst({
      where: { 
        id: auth.userId,
        status: 'ACTIVE',
        deletedAt: null
      },
      include: {
        memberships: {
          where: {
            id: auth.membershipId,
            organizationId: auth.organizationId,
            status: 'ACTIVE',
            organization: {
              status: 'ACTIVE',
              deletedAt: null
            }
          },
          include: {
            organization: true,
            role: true
          }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return null;
    }

    if (user.sessionVersion !== auth.sessionVersion) {
      return null;
    }

    const membership = user.memberships[0];

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug
      },
      membership: {
        id: membership.id,
        roleCode: membership.role.code
      }
    };
  }

  async getUserOrganizations(userId: string, currentOrganizationId: string) {
    const prisma = this.database.getClient();
    
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        organization: {
          status: 'ACTIVE',
          deletedAt: null
        }
      },
      include: {
        organization: true,
        role: true
      },
      orderBy: {
        organization: {
          name: 'asc'
        }
      }
    });

    return memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      roleCode: m.role.code,
      isCurrent: m.organization.id === currentOrganizationId
    }));
  }

  async switchOrganization(
    currentSessionKey: string,
    targetOrganizationId: string,
    userId: string,
    sessionVersion: number
  ): Promise<{ sessionId: string; maxAge: number; targetMembershipId: string } | null> {
    const prisma = this.database.getClient();

    // Validate target membership
    const targetMembership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId: targetOrganizationId,
        status: 'ACTIVE',
        organization: {
          status: 'ACTIVE',
          deletedAt: null
        }
      }
    });

    if (!targetMembership) {
      return null;
    }

    // Read the current session to preserve original fields
    const currentSessionData = await this.getSessionByKey(currentSessionKey);
    if (!currentSessionData) {
      return null;
    }

    // Rotate: new sessionId, new csrfSecret, preserve absoluteExpiresAt
    const newSessionId = randomBytes(64).toString('hex');
    const newHash = createHash('sha256').update(newSessionId).digest('hex');
    const idleTimeout = 30 * 60;

    const now = new Date();
    const absExp = new Date(currentSessionData.absoluteExpiresAt);
    const absoluteRemainingSecs = Math.floor((absExp.getTime() - now.getTime()) / 1000);

    if (absoluteRemainingSecs <= 0) {
      // Session has absolutely expired — destroy it
      await this.destroySessionByKey(currentSessionKey);
      return null;
    }

    const newTtl = Math.min(idleTimeout, absoluteRemainingSecs);

    const rotatedSession: RedisSession = {
      userId: currentSessionData.userId,
      membershipId: targetMembership.id,
      organizationId: targetOrganizationId,
      sessionVersion,
      createdAt: currentSessionData.createdAt,
      lastActivityAt: now.toISOString(),
      absoluteExpiresAt: currentSessionData.absoluteExpiresAt,
      userAgent: currentSessionData.userAgent,
      csrfSecret: randomBytes(32).toString('hex')
    };

    // Write new session key
    await this.redis.setex(`session:${newHash}`, newTtl, JSON.stringify(rotatedSession));

    // Destroy old session key
    await this.destroySessionByKey(currentSessionKey);

    const absoluteMaxAge = 7 * 24 * 60 * 60;

    return {
      sessionId: newSessionId,
      maxAge: absoluteMaxAge,
      targetMembershipId: targetMembership.id
    };
  }

  generateCsrfToken(csrfSecret: string, action: string): string {
    const hmacSecret = this.config.get<string>('CSRF_HMAC_SECRET');
    if (!hmacSecret) {
      throw new Error('CSRF_HMAC_SECRET is not configured');
    }
    const hmac = createHmac('sha256', hmacSecret);
    hmac.update(`${action}:${csrfSecret}`);
    return hmac.digest('hex');
  }

  verifyCsrfToken(csrfSecret: string, action: string, token: string): boolean {
    const expected = this.generateCsrfToken(csrfSecret, action);
    if (expected.length !== token.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  }
}
