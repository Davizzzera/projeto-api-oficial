import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnv } from './env.config';

describe('validateEnv', () => {
  it('should pass with all required fields', () => {
    const env = {
      NODE_ENV: 'development',
      APP_ENV: 'local',
      API_PORT: 3333,
      DATABASE_URL: 'postgresql://localhost',
      REDIS_URL: 'redis://localhost',
      SESSION_COOKIE_SECRET: 'super_secret_cookie_secret_32_bytes',
      CSRF_HMAC_SECRET: 'super_secret_csrf_hmac_secret_32_bytes',
    };
    const result = validateEnv(env);
    expect(result.NODE_ENV).toBe('development');
    expect(result.API_PORT).toBe(3333);
    expect(result.DATABASE_URL).toBe(env.DATABASE_URL);
    expect(result.REDIS_URL).toBe(env.REDIS_URL);
  });

  it('should apply defaults for optional fields', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      SESSION_COOKIE_SECRET: 'super_secret_cookie_secret_32_bytes',
      CSRF_HMAC_SECRET: 'super_secret_csrf_hmac_secret_32_bytes',
    };
    const result = validateEnv(env);
    expect(result.NODE_ENV).toBe('development');
    expect(result.APP_ENV).toBe('development');
    expect(result.API_PORT).toBe(3333);
    expect(result.LOG_LEVEL).toBe('info');
  });

  it('should exit process when DATABASE_URL is missing', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateEnv({ REDIS_URL: 'redis://localhost:6379' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should exit process when REDIS_URL is missing', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    validateEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should coerce API_PORT from string to number', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      API_PORT: '4000',
      SESSION_COOKIE_SECRET: 'super_secret_cookie_secret_32_bytes',
      CSRF_HMAC_SECRET: 'super_secret_csrf_hmac_secret_32_bytes',
    };
    const result = validateEnv(env);
    expect(result.API_PORT).toBe(4000);
  });
});
