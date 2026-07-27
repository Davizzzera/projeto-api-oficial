import { Injectable, ConflictException } from '@nestjs/common';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { RedisSession, RedisSessionSchema } from '../schemas/redis-session.schema';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class RedisSessionRepository {
  constructor(private readonly redis: RedisService) {}

  async rotateSession(
    currentSessionKey: string,
    targetMembershipId: string,
    targetOrganizationId: string,
    sessionVersion: number
  ): Promise<{ newSessionId: string, newSessionKey: string, oldSessionStr: string, newTtl: number } | null> {
    await this.redis.watch(currentSessionKey);
    const currentSessionStr = await this.redis.get(currentSessionKey);

    if (!currentSessionStr) {
      await this.redis.unwatch();
      return null;
    }

    let currentSessionData: RedisSession;
    try {
      currentSessionData = RedisSessionSchema.parse(JSON.parse(currentSessionStr));
    } catch {
      await this.redis.unwatch();
      return null;
    }

    const now = new Date();
    const absExp = new Date(currentSessionData.absoluteExpiresAt);
    const absoluteRemainingSecs = Math.floor((absExp.getTime() - now.getTime()) / 1000);

    if (absoluteRemainingSecs <= 0) {
      await this.redis.unwatch();
      await this.redis.del(currentSessionKey);
      return null;
    }

    const idleTimeout = 30 * 60;
    const newTtl = Math.min(idleTimeout, absoluteRemainingSecs);

    const newSessionId = randomBytes(64).toString('hex');
    const newHash = createHash('sha256').update(newSessionId).digest('hex');
    const newSessionKey = `session:${newHash}`;

    const rotatedSession: RedisSession = {
      userId: currentSessionData.userId,
      membershipId: targetMembershipId,
      organizationId: targetOrganizationId,
      sessionVersion,
      createdAt: currentSessionData.createdAt,
      lastActivityAt: now.toISOString(),
      absoluteExpiresAt: currentSessionData.absoluteExpiresAt,
      userAgent: currentSessionData.userAgent,
      csrfSecret: randomBytes(32).toString('hex')
    };

    const multi = this.redis.multi();
    multi.del(currentSessionKey);
    multi.setex(newSessionKey, newTtl, JSON.stringify(rotatedSession));
    
    const results = await multi.exec();
    if (!results) {
      throw new ConflictException('Concurrent session rotation detected');
    }

    return { newSessionId, newSessionKey, oldSessionStr: currentSessionStr, newTtl };
  }

  async rollbackRotation(
    oldSessionKey: string,
    newSessionKey: string,
    oldSessionStr: string,
    ttl: number
  ): Promise<void> {
    const multi = this.redis.multi();
    multi.del(newSessionKey);
    multi.setex(oldSessionKey, ttl, oldSessionStr);
    await multi.exec();
  }
}
