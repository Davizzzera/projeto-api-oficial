import { DatabaseService } from '../../../infrastructure/database/database.service';
export declare class RoleRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findByCode(code: string): Promise<{
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
    }>;
    findAll(): Promise<{
        code: string;
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
    }[]>;
}
