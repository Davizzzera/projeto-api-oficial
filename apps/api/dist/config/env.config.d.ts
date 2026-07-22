import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    APP_ENV: z.ZodDefault<z.ZodString>;
    API_PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    REDIS_URL_TEST: z.ZodOptional<z.ZodString>;
    SESSION_COOKIE_SECRET: z.ZodString;
    CSRF_HMAC_SECRET: z.ZodString;
    LOG_LEVEL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV?: "development" | "production" | "test";
    APP_ENV?: string;
    API_PORT?: number;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    REDIS_URL_TEST?: string;
    SESSION_COOKIE_SECRET?: string;
    CSRF_HMAC_SECRET?: string;
    LOG_LEVEL?: string;
}, {
    NODE_ENV?: "development" | "production" | "test";
    APP_ENV?: string;
    API_PORT?: number;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    REDIS_URL_TEST?: string;
    SESSION_COOKIE_SECRET?: string;
    CSRF_HMAC_SECRET?: string;
    LOG_LEVEL?: string;
}>;
export declare function validateEnv(config: Record<string, unknown>): {
    NODE_ENV?: "development" | "production" | "test";
    APP_ENV?: string;
    API_PORT?: number;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    REDIS_URL_TEST?: string;
    SESSION_COOKIE_SECRET?: string;
    CSRF_HMAC_SECRET?: string;
    LOG_LEVEL?: string;
};
