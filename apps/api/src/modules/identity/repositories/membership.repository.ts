import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { Prisma } from '@repo/database';

@Injectable()
export class MembershipRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByOrganizationAndUserId(organizationId: string, userId: string) {
    return this.db.getClient().membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        }
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async findManyByOrganization(organizationId: string, options?: { skip?: number; take?: number }) {
    const { skip = 0, take = 20 } = options || {};
    
    return this.db.getClient().membership.findMany({
      where: {
        organizationId,
      },
      skip,
      take,
      include: {
        user: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async countByOrganization(organizationId: string) {
    return this.db.getClient().membership.count({
      where: {
        organizationId,
      }
    });
  }
}
