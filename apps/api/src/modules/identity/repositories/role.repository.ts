import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { Prisma } from '@repo/database';

@Injectable()
export class RoleRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByCode(code: string) {
    return this.db.getClient().role.findUnique({
      where: {
        code,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async findAll() {
    return this.db.getClient().role.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}
