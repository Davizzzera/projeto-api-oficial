import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { UserRepository } from '../repositories/user.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { RedisSessionSchema, RedisSession } from './schemas/redis-session.schema';
import { AuthPrincipal } from '../../../common/types/auth-principal';

@Injectable()
export class SessionValidationService {
  constructor(
    private readonly redis: RedisService,
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async validateSession(req: FastifyRequest): Promise<{ authPrincipal: AuthPrincipal, authSessionKey: string }> {
    const sessionCookie = req.cookies.session_id;
    if (!sessionCookie) {
      throw new UnauthorizedException('No session cookie');
    }

    const unsignedSession = req.unsignCookie(sessionCookie);
    if (!unsignedSession.valid || !unsignedSession.value) {
      throw new UnauthorizedException('Invalid session signature');
    }

    const sessionId = unsignedSession.value;
    const hash = createHash('sha256').update(sessionId).digest('hex');
    const authSessionKey = `session:${hash}`;

    const dataStr = await this.redis.get(authSessionKey);
    if (!dataStr) {
      throw new UnauthorizedException('Session not found in store');
    }

    let sessionData: RedisSession;
    try {
      sessionData = RedisSessionSchema.parse(JSON.parse(dataStr));
    } catch {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Invalid session data format');
    }

    const now = new Date();
    const absExp = new Date(sessionData.absoluteExpiresAt);
    if (now >= absExp) {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Session absolute expiration reached');
    }

    const user = await this.userRepository.findById(sessionData.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('User is not active');
    }

    if (user.sessionVersion !== sessionData.sessionVersion) {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Session version mismatch');
    }

    const organization = await this.organizationRepository.findById(sessionData.organizationId);
    if (!organization || organization.status !== 'ACTIVE') {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Organization is not active');
    }

    const membership = await this.membershipRepository.findByOrganizationAndUserId(
      sessionData.organizationId,
      sessionData.userId
    );

    if (!membership || membership.status !== 'ACTIVE') {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Membership is not active');
    }

    // Refresh idle timeout
    sessionData.lastActivityAt = now.toISOString();
    const absoluteRemainingSecs = Math.floor((absExp.getTime() - now.getTime()) / 1000);
    const idleTimeout = 30 * 60; // 30 minutes
    const newTtl = Math.min(idleTimeout, absoluteRemainingSecs);

    if (newTtl > 0) {
      await this.redis.setex(authSessionKey, newTtl, JSON.stringify(sessionData));
    } else {
      await this.redis.del(authSessionKey);
      throw new UnauthorizedException('Session expired');
    }

    const permissions = membership.role.rolePermissions.map(rp => rp.permission.key);

    const authPrincipal: AuthPrincipal = {
      userId: user.id,
      membershipId: membership.id,
      organizationId: organization.id,
      sessionVersion: user.sessionVersion,
      roleCode: membership.role.code,
      permissions: [...new Set(permissions)], // unique strings
      platformRole: user.platformRole || 'NONE'
    };

    return { authPrincipal, authSessionKey };
  }
}
