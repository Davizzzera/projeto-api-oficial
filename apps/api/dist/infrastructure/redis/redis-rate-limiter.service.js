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
exports.RedisRateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
const crypto_1 = require("crypto");
let RedisRateLimiterService = class RedisRateLimiterService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async checkLimit(type, rawIdentifier, limit, windowSecs) {
        const identifier = (0, crypto_1.createHash)('sha256').update(rawIdentifier).digest('hex');
        const key = `ratelimit:${type}:${identifier}`;
        const multi = this.redis.multi();
        multi.incr(key);
        multi.ttl(key);
        const results = await multi.exec();
        if (!results)
            return false;
        const currentCount = results[0][1];
        const ttl = results[1][1];
        if (currentCount === 1 || ttl === -1) {
            await this.redis.expire(key, windowSecs);
        }
        return currentCount <= limit;
    }
};
exports.RedisRateLimiterService = RedisRateLimiterService;
exports.RedisRateLimiterService = RedisRateLimiterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisRateLimiterService);
//# sourceMappingURL=redis-rate-limiter.service.js.map