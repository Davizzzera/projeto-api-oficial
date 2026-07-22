"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationMetaSchema = exports.PaginationInputSchema = exports.AuditLogSummarySchema = exports.SecurityEventSummarySchema = exports.MembershipSummarySchema = exports.PermissionSummarySchema = exports.RoleSummarySchema = exports.OrganizationSummarySchema = exports.UserSummarySchema = exports.SecurityEventSeveritySchema = exports.ThemePreferenceSchema = exports.MembershipStatusSchema = exports.OrganizationStatusSchema = exports.UserStatusSchema = void 0;
const zod_1 = require("zod");
exports.UserStatusSchema = zod_1.z.enum(["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "SUSPENDED"]);
exports.OrganizationStatusSchema = zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
exports.MembershipStatusSchema = zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
exports.ThemePreferenceSchema = zod_1.z.enum(["LIGHT", "DARK", "SYSTEM"]);
exports.SecurityEventSeveritySchema = zod_1.z.enum(["INFO", "WARNING", "CRITICAL"]);
exports.UserSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    status: exports.UserStatusSchema,
    mfaEnabled: zod_1.z.boolean(),
    emailVerifiedAt: zod_1.z.string().datetime().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
    // Não incluir: passwordHash, platformRole, sessionVersion, deletedAt
});
exports.OrganizationSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    status: exports.OrganizationStatusSchema,
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.RoleSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime()
});
exports.PermissionSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime()
});
exports.MembershipSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    roleId: zod_1.z.string().uuid(),
    status: exports.MembershipStatusSchema,
    themePreference: exports.ThemePreferenceSchema,
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    // Relações opcionais para respostas compostas
    user: exports.UserSummarySchema.optional(),
    organization: exports.OrganizationSummarySchema.optional(),
    role: exports.RoleSummarySchema.optional()
});
exports.SecurityEventSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    eventType: zod_1.z.string(),
    severity: exports.SecurityEventSeveritySchema,
    ipAddressMasked: zod_1.z.string().nullable(),
    userAgent: zod_1.z.string().nullable(),
    userId: zod_1.z.string().uuid().nullable(),
    organizationId: zod_1.z.string().uuid().nullable(),
    metadata: zod_1.z.record(zod_1.z.unknown()).nullable(),
    occurredAt: zod_1.z.string().datetime()
});
exports.AuditLogSummarySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    action: zod_1.z.string(),
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string(),
    organizationId: zod_1.z.string().uuid(),
    actorUserId: zod_1.z.string().uuid().nullable(),
    metadata: zod_1.z.record(zod_1.z.unknown()).nullable(),
    correlationId: zod_1.z.string().nullable(),
    occurredAt: zod_1.z.string().datetime()
});
// Pagination
exports.PaginationInputSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20)
});
exports.PaginationMetaSchema = zod_1.z.object({
    total: zod_1.z.number().int().nonnegative(),
    page: zod_1.z.number().int().min(1),
    limit: zod_1.z.number().int().min(1),
    totalPages: zod_1.z.number().int().nonnegative()
});
