import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  REDIS_URL_TEST: z.string().url().optional(),
  SESSION_COOKIE_SECRET: z.string().min(32),
  CSRF_HMAC_SECRET: z.string().min(32),
  LOG_LEVEL: z.string().default('info'),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  
  if (!parsed.success) {
    console.error('❌ Configuração de ambiente inválida', parsed.error.format());
    process.exit(1);
  }
  
  return parsed.data;
}
