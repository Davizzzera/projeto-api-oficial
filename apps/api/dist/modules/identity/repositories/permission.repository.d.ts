import { DatabaseService } from '../../../infrastructure/database/database.service';
export declare class PermissionRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Promise<{
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        key: string;
    }[]>;
}
