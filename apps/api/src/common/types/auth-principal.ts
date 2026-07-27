import { RedisSession } from '../../modules/identity/auth/schemas/redis-session.schema';

export interface AuthPrincipal {
  userId: string;
  membershipId: string;
  organizationId: string;
  sessionVersion: number;
  roleCode: string;
  permissions: string[];
  platformRole: string;
}

export type StoredSession = RedisSession;
