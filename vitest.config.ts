import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const CF_EMAIL = fileURLToPath(new URL('./test/mocks/cloudflare-email.ts', import.meta.url));
const CF_WORKERS = fileURLToPath(new URL('./test/mocks/cloudflare-workers.ts', import.meta.url));
const CF_LOADER = fileURLToPath(new URL('./test/mocks/cf-loader.mjs', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:email': CF_EMAIL,
      'cloudflare:workers': CF_WORKERS,
    },
  },
  test: {
    environment: 'node',
    include: ['test/unit/**/*.test.ts', 'test/integration/privacy-smoke.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    poolOptions: {
      forks: {
        execArgv: ['--import', CF_LOADER],
      },
    },
    server: {
      deps: {
        inline: ['agents', '@cloudflare/workers-oauth-provider'],
      },
    },
  },
});
