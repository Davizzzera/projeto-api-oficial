import { z } from "zod";

export const UserStatusSchema = z.enum(["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "SUSPENDED"]);
export const OrganizationStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const MembershipStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const ThemePreferenceSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);
export const SecurityEventSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);

export const UserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  status: UserStatusSchema,
  mfaEnabled: z.boolean(),
  emailVerifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
  // Não incluir: passwordHash, platformRole, sessionVersion, deletedAt
});

export const OrganizationSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  status: OrganizationStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const RoleSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime()
});

export const PermissionSummarySchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime()
});

export const MembershipSummarySchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  status: MembershipStatusSchema,
  themePreference: ThemePreferenceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Relações opcionais para respostas compostas
  user: UserSummarySchema.optional(),
  organization: OrganizationSummarySchema.optional(),
  role: RoleSummarySchema.optional()
});

export const SecurityEventSummarySchema = z.object({
  id: z.string().uuid(),
  eventType: z.string(),
  severity: SecurityEventSeveritySchema,
  ipAddressMasked: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string().uuid().nullable(),
  organizationId: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  occurredAt: z.string().datetime()
});

export const AuditLogSummarySchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  correlationId: z.string().nullable(),
  occurredAt: z.string().datetime()
});

// Pagination
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative()
});

// Types derived from schemas
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>;
export type MembershipSummary = z.infer<typeof MembershipSummarySchema>;
export type RoleSummary = z.infer<typeof RoleSummarySchema>;
export type PermissionSummary = z.infer<typeof PermissionSummarySchema>;
export type SecurityEventSummary = z.infer<typeof SecurityEventSummarySchema>;
export type AuditLogSummary = z.infer<typeof AuditLogSummarySchema>;

export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
