import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    envDir: '../../',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    exclude: ['test/integration/**'],
  },
});
