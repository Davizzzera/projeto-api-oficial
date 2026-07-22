import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { AuditLog, Prisma } from '@repo/database';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    action: string;
    entityType: string;
    entityId: string;
    organizationId: string;
    actorUserId?: string;
    metadata?: Prisma.InputJsonValue;
    correlationId?: string;
  }): Promise<AuditLog> {
    return this.db.getClient().auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        organization: { connect: { id: data.organizationId } },
        ...(data.actorUserId && { actorUser: { connect: { id: data.actorUserId } } }),
        metadata: data.metadata,
        correlationId: data.correlationId,
      },
    });
  }

  async findManyByOrganization(organizationId: string, options?: { skip?: number; take?: number }): Promise<AuditLog[]> {
    const { skip = 0, take = 50 } = options || {};
    return this.db.getClient().auditLog.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
    });
  }
}

