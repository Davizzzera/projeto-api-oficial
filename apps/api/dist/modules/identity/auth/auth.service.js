"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../../infrastructure/redis/redis.service");
const database_service_1 = require("../../../infrastructure/database/database.service");
const crypto_1 = require("crypto");
const security_1 = require("@repo/security");
let AuthService = class AuthService {
    redis;
    database;
    constructor(redis, database) {
        this.redis = redis;
        this.database = database;
    }
    async generatePreAuthNonce() {
        const nonce = (0, crypto_1.randomBytes)(32).toString('hex');
        const hash = (0, crypto_1.createHash)('sha256').update(nonce).digest('hex');
        await this.redis.setex(`preauth:${hash}`, 10 * 60, '1');
        return nonce;
    }
    async consumePreAuthNonce(nonce) {
        const hash = (0, crypto_1.createHash)('sha256').update(nonce).digest('hex');
        const result = await this.redis.del(`preauth:${hash}`);
        return result > 0;
    }
    async validateCredentials(email, password) {
        const prisma = this.database.getClient();
        const user = await prisma.user.findUnique({
            where: { emailNormalized: email.toLowerCase() },
        });
        if (!user) {
            return null;
        }
        const isValid = await (0, security_1.verifyPassword)(user.passwordHash, password);
        if (isValid) {
            return { id: user.id };
        }
        return null;
    }
    async createSession(userId, ip, userAgent) {
        const sessionId = (0, crypto_1.randomBytes)(64).toString('hex');
        const hash = (0, crypto_1.createHash)('sha256').update(sessionId).digest('hex');
        const absoluteMaxAge = 7 * 24 * 60 * 60;
        const idleTimeout = 30 * 60;
        const absoluteExpiresAt = Math.floor(Date.now() / 1000) + absoluteMaxAge;
        const sessionData = {
            userId,
            ip,
            userAgent,
            absoluteExpiresAt,
            csrfSecret: (0, crypto_1.randomBytes)(32).toString('hex')
        };
        await this.redis.setex(`session:${hash}`, idleTimeout, JSON.stringify(sessionData));
        return { sessionId, maxAge: absoluteMaxAge };
    }
    async getSession(sessionId) {
        const hash = (0, crypto_1.createHash)('sha256').update(sessionId).digest('hex');
        const dataStr = await this.redis.get(`session:${hash}`);
        if (!dataStr)
            return null;
        const sessionData = JSON.parse(dataStr);
        const now = Math.floor(Date.now() / 1000);
        if (now >= sessionData.absoluteExpiresAt) {
            await this.redis.del(`session:${hash}`);
            return null;
        }
        const absoluteRemaining = sessionData.absoluteExpiresAt - now;
        const idleTimeout = 30 * 60;
        const newTtl = Math.min(idleTimeout, absoluteRemaining);
        if (newTtl > 0) {
            await this.redis.expire(`session:${hash}`, newTtl);
        }
        else {
            await this.redis.del(`session:${hash}`);
            return null;
        }
        return {
            user: { id: sessionData.userId },
            session: sessionData
        };
    }
    async destroySession(sessionId) {
        const hash = (0, crypto_1.createHash)('sha256').update(sessionId).digest('hex');
        await this.redis.del(`session:${hash}`);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        database_service_1.DatabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map