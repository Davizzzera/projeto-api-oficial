import { DatabaseService } from '../../../infrastructure/database/database.service';
export declare class MembershipRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findByOrganizationAndUserId(organizationId: string, userId: string): Promise<{
        role: {
            rolePermissions: ({
                permission: {
                    description: string | null;
                    id: string;
                    name: string;
                    createdAt: Date;
                    key: string;
                };
            } & {
                roleId: string;
                permissionId: string;
            })[];
        } & {
            code: string;
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
        };
    } & {
        status: import("@repo/database").MembershipStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        themePreference: import("@repo/database").ThemePreference;
        userId: string;
        roleId: string;
    }>;
    findManyByOrganization(organizationId: string, options?: {
        skip?: number;
        take?: number;
    }): Promise<({
        user: {
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
        };
        role: {
            code: string;
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
        };
    } & {
        status: import("@repo/database").MembershipStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        themePreference: import("@repo/database").ThemePreference;
        userId: string;
        roleId: string;
    })[]>;
    countByOrganization(organizationId: string): Promise<number>;
}
