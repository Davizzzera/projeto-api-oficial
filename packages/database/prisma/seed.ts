import 'dotenv/config';
import { createPrismaClient, PlatformRole } from '../src/index';

const prisma = createPrismaClient(process.env.DATABASE_URL!);

async function main() {
  console.log('Starting seed...');

  // 1. Roles padrão
  const roles = [
    { code: 'ADMIN', name: 'Admin', description: 'Administrator with full access to organization' },
    { code: 'MEMBER', name: 'Member', description: 'Standard member with read/write access to resources' },
    { code: 'VIEWER', name: 'Viewer', description: 'Read-only access to organization resources' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  // 2. Permissions iniciais
  const permissions = [
    { key: 'org:read', name: 'Read Organization', description: 'Can read organization details' },
    { key: 'org:write', name: 'Write Organization', description: 'Can modify organization details' },
    { key: 'members:read', name: 'Read Members', description: 'Can read organization members' },
    { key: 'members:write', name: 'Write Members', description: 'Can invite or remove members' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, description: perm.description },
      create: perm,
    });
  }

  // 3. Organização demonstrativa
  const orgSlug = process.env.SEED_ORGANIZATION_SLUG || 'demo-org';
  const orgName = process.env.SEED_ORGANIZATION_NAME || 'Demo Organization';
  let org = null;

  if (orgSlug && orgName) {
    org = await prisma.organization.upsert({
      where: { slug: orgSlug },
      update: {},
      create: {
        name: orgName,
        slug: orgSlug,
      },
    });
  }

  // 4. Usuário demonstrativo (Somente ADMIN, não SUPER_ADMIN)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@demo.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || '123456';
  let user = null;

  if (adminEmail && adminPassword && org) {
    // mock hash for seed (in a real scenario we use @repo/security or similar)
    const mockPasswordHash = `$argon2id$v=19$m=65536,t=3,p=4$ZeTn6LKqsm+wckyQHt/NdQ$H9pp1IOKm/xOjOWgmhAoxUO6x8Hdbb6Fm0JP+OfwNMc`;
    
    // Check if user exists first to avoid re-hashing or overwriting password
    const existingUser = await prisma.user.findUnique({
      where: { emailNormalized: adminEmail.toLowerCase() }
    });

    if (!existingUser) {
      const passwordHash = mockPasswordHash;
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          emailNormalized: adminEmail.toLowerCase(),
          name: 'Demo Admin',
          passwordHash,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: mockPasswordHash },
      });
    }
  }

  // 5. Vincular usuário à organização (Membership)
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  
  if (adminRole) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
