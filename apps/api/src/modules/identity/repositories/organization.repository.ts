import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { Prisma } from '@repo/database';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string) {
    return this.db.getClient().organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.db.getClient().organization.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
  }

  async create(data: Omit<Prisma.OrganizationCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return this.db.getClient().organization.create({
      data,
    });
  }
}
