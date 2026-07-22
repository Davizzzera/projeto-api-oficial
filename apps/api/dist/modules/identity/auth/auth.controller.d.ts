import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RedisRateLimiterService } from '../../../infrastructure/redis/redis-rate-limiter.service';
export declare class AuthController {
    private readonly authService;
    private readonly rateLimiter;
    constructor(authService: AuthService, rateLimiter: RedisRateLimiterService);
    getCsrf(res: FastifyReply): Promise<{
        csrfToken: string;
    }>;
    login(req: FastifyRequest, res: FastifyReply, csrfToken?: string, origin?: string, referer?: string, userAgentRaw?: string, forwardedFor?: string): Promise<void>;
    me(req: FastifyRequest, res: FastifyReply): Promise<any>;
    logout(req: FastifyRequest, res: FastifyReply): Promise<void>;
}
