import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { verifyPassword } from '@repo/security';
import { RedisSession, RedisSessionSchema } from './schemas/redis-session.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly database: DatabaseService
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

  async getMeData(session: RedisSession) {
    const prisma = this.database.getClient();
    
    const user = await prisma.user.findFirst({
      where: { 
        id: session.userId,
        status: 'ACTIVE',
        deletedAt: null
      },
      include: {
        memberships: {
          where: {
            id: session.membershipId,
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

    if (user.sessionVersion !== session.sessionVersion) {
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

  generateCsrfToken(csrfSecret: string, action: string): string {
    const hmacSecret = process.env.CSRF_HMAC_SECRET || 'default_hmac_secret_for_tests';
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
