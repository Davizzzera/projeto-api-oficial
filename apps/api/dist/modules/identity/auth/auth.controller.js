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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const redis_rate_limiter_service_1 = require("../../../infrastructure/redis/redis-rate-limiter.service");
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
let AuthController = class AuthController {
    authService;
    rateLimiter;
    constructor(authService, rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }
    async getCsrf(res) {
        res.header('Cache-Control', 'no-store');
        const nonce = await this.authService.generatePreAuthNonce();
        res.setCookie('preauth_session', nonce, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            signed: true,
            maxAge: 10 * 60,
        });
        return { csrfToken: nonce };
    }
    async login(req, res, csrfToken, origin, referer, userAgentRaw, forwardedFor) {
        const ip = (process.env.NODE_ENV === 'production' && forwardedFor ? forwardedFor.split(',')[0] : req.ip) || 'unknown';
        const ipAllowed = await this.rateLimiter.checkLimit('ip', ip, 50, 15 * 60);
        if (!ipAllowed) {
            res.status(common_1.HttpStatus.TOO_MANY_REQUESTS);
            return;
        }
        const preauthSession = req.cookies.preauth_session;
        if (!preauthSession) {
            throw new common_1.ForbiddenException('Missing pre-login session');
        }
        const unsignedPreauth = req.unsignCookie(preauthSession);
        if (!unsignedPreauth.valid || !unsignedPreauth.value) {
            throw new common_1.ForbiddenException('Invalid pre-login session signature');
        }
        if (!csrfToken || unsignedPreauth.value !== csrfToken) {
            throw new common_1.ForbiddenException('Invalid CSRF token');
        }
        const allowedOrigin = process.env.APP_URL;
        if (origin && allowedOrigin && !origin.startsWith(allowedOrigin)) {
            throw new common_1.ForbiddenException('Invalid Origin');
        }
        if (!origin && referer && allowedOrigin && !referer.startsWith(allowedOrigin)) {
            throw new common_1.ForbiddenException('Invalid Referer');
        }
        const isValidNonce = await this.authService.consumePreAuthNonce(unsignedPreauth.value);
        if (!isValidNonce) {
            throw new common_1.ForbiddenException('CSRF token already used or expired');
        }
        res.clearCookie('preauth_session', { path: '/' });
        const parsedBody = loginSchema.safeParse(req.body);
        if (!parsedBody.success) {
            throw new common_1.UnauthorizedException('Invalid credentials format');
        }
        const { email, password } = parsedBody.data;
        const emailAllowed = await this.rateLimiter.checkLimit('email', email, 10, 15 * 60);
        if (!emailAllowed) {
            res.status(common_1.HttpStatus.TOO_MANY_REQUESTS);
            return;
        }
        const user = await this.authService.validateCredentials(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const userAgent = (userAgentRaw || 'unknown').substring(0, 256);
        const { sessionId, maxAge } = await this.authService.createSession(user.id, ip, userAgent);
        res.setCookie('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            signed: true,
            maxAge: maxAge,
        });
        return;
    }
    async me(req, res) {
        res.header('Cache-Control', 'no-store');
        const sessionCookie = req.cookies.session_id;
        if (!sessionCookie) {
            throw new common_1.UnauthorizedException('No session');
        }
        const unsignedSession = req.unsignCookie(sessionCookie);
        if (!unsignedSession.valid || !unsignedSession.value) {
            throw new common_1.UnauthorizedException('Invalid session signature');
        }
        const sessionData = await this.authService.getSession(unsignedSession.value);
        if (!sessionData) {
            res.clearCookie('session_id', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
            throw new common_1.UnauthorizedException('Session expired or invalid');
        }
        return sessionData.user;
    }
    async logout(req, res) {
        const sessionCookie = req.cookies.session_id;
        if (sessionCookie) {
            const unsignedSession = req.unsignCookie(sessionCookie);
            if (unsignedSession.valid && unsignedSession.value) {
                await this.authService.destroySession(unsignedSession.value);
            }
        }
        res.clearCookie('session_id', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        return;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('csrf'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCsrf", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Headers)('x-csrf-token')),
    __param(3, (0, common_1.Headers)('origin')),
    __param(4, (0, common_1.Headers)('referer')),
    __param(5, (0, common_1.Headers)('user-agent')),
    __param(6, (0, common_1.Headers)('x-forwarded-for')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        redis_rate_limiter_service_1.RedisRateLimiterService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map