import 'dotenv/config';
import { createPrismaClient, PlatformRole } from '../src/index';
import { z } from 'zod';
import { hashPassword } from '@repo/security';

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

  // 2.5 Role Permissions
  const rolePermissionMap = {
    'ADMIN': ['org:read', 'org:write', 'members:read', 'members:write'],
    'MEMBER': ['org:read', 'members:read'],
    'VIEWER': ['org:read']
  };

  const dbRoles = await prisma.role.findMany();
  const dbPerms = await prisma.permission.findMany();

  for (const [roleCode, permKeys] of Object.entries(rolePermissionMap)) {
    const role = dbRoles.find(r => r.code === roleCode);
    if (!role) continue;

    for (const key of permKeys) {
      const perm = dbPerms.find(p => p.key === key);
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id
        }
      });
    }
  }

  // 3. Organização demonstrativa
  const seedEnvSchema = z.object({
    SEED_ADMIN_EMAIL: z.string().email(),
    SEED_ADMIN_PASSWORD: z.string().min(1),
    SEED_ORGANIZATION_NAME: z.string().min(1),
    SEED_ORGANIZATION_SLUG: z.string().min(1)
  });

  const parsedEnv = seedEnvSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    console.error("Variáveis de ambiente do seed ausentes ou inválidas:");
    console.error(parsedEnv.error.flatten().fieldErrors);
    process.exit(1);
  }

  const {
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD,
    SEED_ORGANIZATION_NAME,
    SEED_ORGANIZATION_SLUG
  } = parsedEnv.data;

  let org = await prisma.organization.upsert({
    where: { slug: SEED_ORGANIZATION_SLUG },
    update: {},
    create: {
      name: SEED_ORGANIZATION_NAME,
      slug: SEED_ORGANIZATION_SLUG,
    },
  });

  let user = await prisma.user.findUnique({
    where: { emailNormalized: SEED_ADMIN_EMAIL.toLowerCase() }
  });

  if (!user) {
    const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);
    user = await prisma.user.create({
      data: {
        email: SEED_ADMIN_EMAIL,
        emailNormalized: SEED_ADMIN_EMAIL.toLowerCase(),
        name: 'Admin',
        passwordHash,
      },
    });
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
