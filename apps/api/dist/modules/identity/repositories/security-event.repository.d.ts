import { DatabaseService } from '../../../infrastructure/database/database.service';
import { SecurityEventSeverity, SecurityEvent, Prisma } from '@repo/database';
export declare class SecurityEventRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        eventType: string;
        severity: SecurityEventSeverity;
        ipAddressMasked?: string;
        ipAddressHash?: string;
        userAgent?: string;
        userId?: string;
        organizationId?: string;
        metadata?: Prisma.InputJsonValue;
    }): Promise<SecurityEvent>;
    findManyByOrganization(organizationId: string, options?: {
        skip?: number;
        take?: number;
    }): Promise<SecurityEvent[]>;
    findManyByUser(userId: string, options?: {
        skip?: number;
        take?: number;
    }): Promise<SecurityEvent[]>;
}
