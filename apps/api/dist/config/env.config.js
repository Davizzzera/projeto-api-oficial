"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    APP_ENV: zod_1.z.string().default('development'),
    API_PORT: zod_1.z.coerce.number().default(3333),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    REDIS_URL_TEST: zod_1.z.string().url().optional(),
    SESSION_COOKIE_SECRET: zod_1.z.string().min(32),
    CSRF_HMAC_SECRET: zod_1.z.string().min(32),
    LOG_LEVEL: zod_1.z.string().default('info'),
});
function validateEnv(config) {
    const parsed = exports.envSchema.safeParse(config);
    if (!parsed.success) {
        console.error('❌ Configuração de ambiente inválida', parsed.error.format());
        process.exit(1);
    }
    return parsed.data;
}
//# sourceMappingURL=env.config.js.map