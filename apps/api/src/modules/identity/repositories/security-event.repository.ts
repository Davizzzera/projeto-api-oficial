import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { SecurityEventSeverity, SecurityEvent, Prisma } from '@repo/database';

@Injectable()
export class SecurityEventRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    eventType: string;
    severity: SecurityEventSeverity;
    ipAddressMasked?: string;
    ipAddressHash?: string;
    userAgent?: string;
    userId?: string;
    organizationId?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<SecurityEvent> {
    return this.db.getClient().securityEvent.create({
      data: {
        eventType: data.eventType,
        severity: data.severity,
        ipAddressMasked: data.ipAddressMasked,
        ipAddressHash: data.ipAddressHash,
        userAgent: data.userAgent,
        ...(data.userId && { user: { connect: { id: data.userId } } }),
        ...(data.organizationId && { organization: { connect: { id: data.organizationId } } }),
        metadata: data.metadata,
      },
    });
  }

  async findManyByOrganization(organizationId: string, options?: { skip?: number; take?: number }): Promise<SecurityEvent[]> {
    const { skip = 0, take = 50 } = options || {};
    return this.db.getClient().securityEvent.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
    });
  }

  async findManyByUser(userId: string, options?: { skip?: number; take?: number }): Promise<SecurityEvent[]> {
    const { skip = 0, take = 50 } = options || {};
    return this.db.getClient().securityEvent.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { occurredAt: 'desc' },
    });
  }
}

