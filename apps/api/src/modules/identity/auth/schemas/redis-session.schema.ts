import { z } from 'zod';

export const RedisSessionSchema = z.object({
  userId: z.string().uuid(),
  membershipId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sessionVersion: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  absoluteExpiresAt: z.string().datetime(),
  userAgent: z.string().nullable(),
  csrfSecret: z.string()
});

export type RedisSession = z.infer<typeof RedisSessionSchema>;
