import { PrismaClient } from '@repo/database';
import { hashPassword } from '@repo/security';
import { randomBytes } from 'crypto';

export class AuthFixture {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async setupActiveUser(options?: { email?: string, password?: string }) {
    const email = options?.email || `user-${randomBytes(4).toString('hex')}@test.com`;
    const password = options?.password || 'Password123!';
    const passwordHash = await hashPassword(password);

    const role = await this.prisma.role.create({
      data: {
        code: `ROLE_${randomBytes(4).toString('hex').toUpperCase()}`,
        name: 'Test Role'
      }
    });

    const org = await this.prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: `org-${randomBytes(4).toString('hex')}`
      }
    });

    const user = await this.prisma.user.create({
      data: {
        name: 'Test User',
        email,
        emailNormalized: email.toLowerCase(),
        passwordHash,
        status: 'ACTIVE'
      }
    });

    const membership = await this.prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        status: 'ACTIVE'
      }
    });

    return {
      user,
      org,
      role,
      membership,
      email,
      password,
      cleanup: async () => {
        await this.prisma.membership.deleteMany({ where: { id: membership.id } });
        await this.prisma.organization.deleteMany({ where: { id: org.id } });
        await this.prisma.user.deleteMany({ where: { id: user.id } });
        if (role) {
          await this.prisma.role.deleteMany({ where: { id: role.id } });
        }
      }
    };
  }

  async setupInactiveUser() {
    const fixture = await this.setupActiveUser();
    await this.prisma.user.update({
      where: { id: fixture.user.id },
      data: { status: 'INACTIVE' }
    });
    return fixture;
  }
  
  async setupDeletedUser() {
    const fixture = await this.setupActiveUser();
    await this.prisma.user.update({
      where: { id: fixture.user.id },
      data: { deletedAt: new Date() }
    });
    return fixture;
  }
  
  async setupInactiveMembership() {
    const fixture = await this.setupActiveUser();
    await this.prisma.membership.update({
      where: { id: fixture.membership.id },
      data: { status: 'INACTIVE' }
    });
    return fixture;
  }
  
  async setupInactiveOrganization() {
    const fixture = await this.setupActiveUser();
    await this.prisma.organization.update({
      where: { id: fixture.org.id },
      data: { status: 'INACTIVE' }
    });
    return fixture;
  }
}
