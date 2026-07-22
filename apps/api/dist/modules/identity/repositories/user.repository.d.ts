import { DatabaseService } from '../../../infrastructure/database/database.service';
export declare class UserRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<{
        status: import("@repo/database").UserStatus;
        email: string;
        id: string;
        emailNormalized: string;
        passwordHash: string;
        name: string;
        platformRole: import("@repo/database").PlatformRole | null;
        sessionVersion: number;
        mfaEnabled: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findByEmail(email: string): Promise<{
        status: import("@repo/database").UserStatus;
        email: string;
        id: string;
        emailNormalized: string;
        passwordHash: string;
        name: string;
        platformRole: import("@repo/database").PlatformRole | null;
        sessionVersion: number;
        mfaEnabled: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
