import { RedisService } from '../../../infrastructure/redis/redis.service';
import { DatabaseService } from '../../../infrastructure/database/database.service';
export declare class AuthService {
    private readonly redis;
    private readonly database;
    constructor(redis: RedisService, database: DatabaseService);
    generatePreAuthNonce(): Promise<string>;
    consumePreAuthNonce(nonce: string): Promise<boolean>;
    validateCredentials(email: string, password: string): Promise<{
        id: string;
    } | null>;
    createSession(userId: string, ip: string, userAgent: string): Promise<{
        sessionId: string;
        maxAge: number;
    }>;
    getSession(sessionId: string): Promise<any | null>;
    destroySession(sessionId: string): Promise<void>;
}
