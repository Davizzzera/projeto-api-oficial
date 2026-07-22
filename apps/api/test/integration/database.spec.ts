import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPrismaClient } from '@repo/database';

describe('Database Integration', () => {
  const dbUrl = (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || '').replace(/^"|"$/g, '');
  const prisma = createPrismaClient(dbUrl);

  beforeAll(async () => {
    // wait for db connect
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enforce append-only on audit_logs', async () => {
    // 1. Create org
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org-' + Date.now(),
      }
    });

    // 2. Create audit log
    const log = await prisma.auditLog.create({
      data: {
        action: 'TEST',
        entityType: 'TEST',
        entityId: '1',
        organizationId: org.id
      }
    });

    expect(log).toBeDefined();

    // 3. Try to update it - should fail
    await expect(prisma.auditLog.update({
      where: { id: log.id },
      data: { action: 'UPDATED' }
    })).rejects.toThrowError(/audit_logs is append-only/);

    // 4. Try to delete it - should fail
    await expect(prisma.auditLog.delete({
      where: { id: log.id }
    })).rejects.toThrowError(/audit_logs is append-only/);

    // cleanup org bypass triggers
    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_append_only`);
    await prisma.auditLog.delete({ where: { id: log.id } });
    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_append_only`);
    await prisma.organization.delete({ where: { id: org.id } });
  });

  it('should enforce slug format', async () => {
    await expect(prisma.organization.create({
      data: {
        name: 'Invalid Slug',
        slug: 'Invalid Slug!', // Uppercase and spaces
      }
    })).rejects.toThrowError();
  });

  it('should enforce email format', async () => {
    await expect(prisma.user.create({
      data: {
        name: 'Test',
        email: ' Test@mail.com ', // Has spaces and uppercase
        emailNormalized: 'test@mail.com', // Correct, but email field violates CHECK
        passwordHash: 'hash'
      }
    })).rejects.toThrowError();
  });

  it('should reject duplicate email', async () => {
    const email = 'duplicate@test.com';
    await prisma.user.create({
      data: {
        name: 'Test 1',
        email,
        emailNormalized: email,
        passwordHash: 'hash'
      }
    });

    await expect(prisma.user.create({
      data: {
        name: 'Test 2',
        email,
        emailNormalized: email,
        passwordHash: 'hash'
      }
    })).rejects.toThrowError(/Unique constraint failed on the fields: \(`email_normalized`\)/);

    await prisma.user.delete({ where: { emailNormalized: email } });
  });

  it('should reject duplicate slug', async () => {
    const slug = 'duplicate-slug';
    await prisma.organization.create({
      data: { name: 'Test Org 1', slug }
    });

    await expect(prisma.organization.create({
      data: { name: 'Test Org 2', slug }
    })).rejects.toThrowError(/Unique constraint failed on the fields: \(`slug`\)/);

    await prisma.organization.delete({ where: { slug } });
  });

  it('should reject duplicate membership', async () => {
    const user = await prisma.user.create({ data: { name: 'Test', email: 'mem@test.com', emailNormalized: 'mem@test.com', passwordHash: 'hash' } });
    const org = await prisma.organization.create({ data: { name: 'Org', slug: 'mem-org' } });
    const role = await prisma.role.create({ data: { code: 'TEST_ROLE', name: 'Test Role' } });

    await prisma.membership.create({
      data: { userId: user.id, organizationId: org.id, roleId: role.id }
    });

    await expect(prisma.membership.create({
      data: { userId: user.id, organizationId: org.id, roleId: role.id }
    })).rejects.toThrowError(/Unique constraint failed/);

    await prisma.membership.deleteMany({ where: { userId: user.id } });
    await prisma.role.delete({ where: { id: role.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('organization A cannot access membership of organization B', async () => {
    const user = await prisma.user.create({ data: { name: 'Test', email: 'iso@test.com', emailNormalized: 'iso@test.com', passwordHash: 'hash' } });
    const orgA = await prisma.organization.create({ data: { name: 'Org A', slug: 'iso-org-a' } });
    const orgB = await prisma.organization.create({ data: { name: 'Org B', slug: 'iso-org-b' } });
    const role = await prisma.role.create({ data: { code: 'ISO_ROLE', name: 'Iso Role' } });

    await prisma.membership.create({
      data: { userId: user.id, organizationId: orgA.id, roleId: role.id }
    });

    const membershipInB = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: orgB.id }
    });

    expect(membershipInB).toBeNull();

    await prisma.membership.deleteMany({ where: { userId: user.id } });
    await prisma.role.delete({ where: { id: role.id } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('update using incorrect organizationId does not modify record', async () => {
    const org1 = await prisma.organization.create({ data: { name: 'Org 1', slug: 'upd-org-1' } });
    const org2 = await prisma.organization.create({ data: { name: 'Org 2', slug: 'upd-org-2' } });

    const event = await prisma.securityEvent.create({
      data: { eventType: 'TEST', severity: 'INFO', organizationId: org1.id }
    });

    const updateAttempt = await prisma.securityEvent.updateMany({
      where: { id: event.id, organizationId: org2.id },
      data: { eventType: 'UPDATED' }
    });

    expect(updateAttempt.count).toBe(0);

    const refetched = await prisma.securityEvent.findUnique({ where: { id: event.id } });
    expect(refetched?.eventType).toBe('TEST');

    await prisma.securityEvent.delete({ where: { id: event.id } });
    await prisma.organization.deleteMany({ where: { id: { in: [org1.id, org2.id] } } });
  });

  it('seed executed twice does not duplicate data and does not alter passwordHash', async () => {
    const { execSync } = require('child_process');
    const path = require('path');
    
    const env = {
      ...process.env,
      DATABASE_URL: dbUrl,
      SEED_ORGANIZATION_SLUG: 'test-seed-org',
      SEED_ORGANIZATION_NAME: 'Test Seed Org',
      SEED_ADMIN_EMAIL: 'seedadmin@test.com',
      SEED_ADMIN_PASSWORD: 'seedpassword123',
    };

    const rootDir = path.resolve(__dirname, '../../../../');

    // Run first time
    execSync('pnpm --filter @repo/database seed', { env, cwd: rootDir, stdio: 'pipe' });

    // Verify first run
    const orgCount1 = await prisma.organization.count({ where: { slug: 'test-seed-org' } });
    expect(orgCount1).toBe(1);

    const user1 = await prisma.user.findUnique({ where: { emailNormalized: 'seedadmin@test.com' } });
    expect(user1).toBeDefined();
    const hash1 = user1?.passwordHash;

    const roleCount1 = await prisma.role.count({ where: { code: 'ADMIN' } });
    expect(roleCount1).toBeGreaterThanOrEqual(1);

    // Run second time
    execSync('pnpm --filter @repo/database seed', { env, cwd: rootDir, stdio: 'pipe' });

    // Verify second run
    const orgCount2 = await prisma.organization.count({ where: { slug: 'test-seed-org' } });
    expect(orgCount2).toBe(1);

    const user2 = await prisma.user.findUnique({ where: { emailNormalized: 'seedadmin@test.com' } });
    expect(user2?.passwordHash).toBe(hash1); // Hash must remain exactly the same

    // Cleanup
    await prisma.membership.deleteMany({ where: { userId: user2?.id } });
    await prisma.user.delete({ where: { id: user2?.id } });
    await prisma.organization.delete({ where: { slug: 'test-seed-org' } });
  }, 30000);
});
