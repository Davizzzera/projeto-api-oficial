import { DatabaseService } from '../../../infrastructure/database/database.service';
import { AuditLog, Prisma } from '@repo/database';
export declare class AuditLogRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        action: string;
        entityType: string;
        entityId: string;
        organizationId: string;
        actorUserId?: string;
        metadata?: Prisma.InputJsonValue;
        correlationId?: string;
    }): Promise<AuditLog>;
    findManyByOrganization(organizationId: string, options?: {
        skip?: number;
        take?: number;
    }): Promise<AuditLog[]>;
}
