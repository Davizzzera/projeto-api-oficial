import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    envDir: '../../',
    include: ['test/integration/**/*.spec.ts'],
    setupFiles: ['./test/integration/setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    })
  ]
});
