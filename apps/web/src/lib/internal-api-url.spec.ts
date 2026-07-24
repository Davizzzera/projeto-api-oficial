import { vi } from 'vitest';
vi.mock('server-only', () => ({}));

import { getInternalApiUrl } from './internal-api-url';

describe('getInternalApiUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns valid origin when configured', () => {
    process.env.INTERNAL_API_URL = 'http://api.example.com/';
    expect(getInternalApiUrl()).toBe('http://api.example.com');
  });

  it('removes trailing slash from valid URL', () => {
    process.env.INTERNAL_API_URL = 'http://api.example.com/api/v1/';
    expect(getInternalApiUrl()).toBe('http://api.example.com');
  });

  it('falls back to localhost in development', () => {
    delete process.env.INTERNAL_API_URL;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    expect(getInternalApiUrl()).toBe('http://localhost:3333');
  });

  it('falls back to localhost in test', () => {
    delete process.env.INTERNAL_API_URL;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', configurable: true });
    expect(getInternalApiUrl()).toBe('http://localhost:3333');
  });

  it('throws error when absent in production', () => {
    delete process.env.INTERNAL_API_URL;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    expect(() => getInternalApiUrl()).toThrow('INTERNAL_API_URL is required');
  });

  it('throws error when URL is invalid', () => {
    process.env.INTERNAL_API_URL = 'invalid-url';
    expect(() => getInternalApiUrl()).toThrow();
  });
});
