import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { createHash, randomBytes } from 'crypto';
import { verifyPassword } from '@repo/security';

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

  async validateCredentials(email: string, password: string): Promise<{ id: string } | null> {
    const prisma = this.database.getClient();
    
    const user = await prisma.user.findUnique({
      where: { emailNormalized: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (isValid) {
      return { id: user.id };
    }
    return null;
  }

  async createSession(userId: string, ip: string, userAgent: string): Promise<{ sessionId: string, maxAge: number }> {
    const sessionId = randomBytes(64).toString('hex');
    const hash = createHash('sha256').update(sessionId).digest('hex');
    
    const absoluteMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const idleTimeout = 30 * 60; // 30 minutes idle timeout

    const absoluteExpiresAt = Math.floor(Date.now() / 1000) + absoluteMaxAge;
    
    const sessionData = {
      userId,
      ip,
      userAgent,
      absoluteExpiresAt,
      // CSRF token for post-login actions
      csrfSecret: randomBytes(32).toString('hex') 
    };

    // Initial TTL is just the idleTimeout, but we store absoluteExpiresAt
    await this.redis.setex(`session:${hash}`, idleTimeout, JSON.stringify(sessionData));
    
    return { sessionId, maxAge: absoluteMaxAge };
  }

  async getSession(sessionId: string): Promise<any | null> {
    const hash = createHash('sha256').update(sessionId).digest('hex');
    const dataStr = await this.redis.get(`session:${hash}`);
    
    if (!dataStr) return null;
    
    const sessionData = JSON.parse(dataStr);
    
    const now = Math.floor(Date.now() / 1000);
    if (now >= sessionData.absoluteExpiresAt) {
      await this.redis.del(`session:${hash}`);
      return null;
    }
    
    const absoluteRemaining = sessionData.absoluteExpiresAt - now;
    const idleTimeout = 30 * 60; // 30 mins
    
    const newTtl = Math.min(idleTimeout, absoluteRemaining);
    if (newTtl > 0) {
      await this.redis.expire(`session:${hash}`, newTtl);
    } else {
      await this.redis.del(`session:${hash}`);
      return null;
    }
    
    return {
      user: { id: sessionData.userId },
      session: sessionData
    };
  }

  async destroySession(sessionId: string): Promise<void> {
    const hash = createHash('sha256').update(sessionId).digest('hex');
    await this.redis.del(`session:${hash}`);
  }
}
