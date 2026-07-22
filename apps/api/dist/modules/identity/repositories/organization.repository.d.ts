import { DatabaseService } from '../../../infrastructure/database/database.service';
import { Prisma } from '@repo/database';
export declare class OrganizationRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<{
        status: import("@repo/database").OrganizationStatus;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
    }>;
    findBySlug(slug: string): Promise<{
        status: import("@repo/database").OrganizationStatus;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
    }>;
    create(data: Omit<Prisma.OrganizationCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<{
        status: import("@repo/database").OrganizationStatus;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
    }>;
}
