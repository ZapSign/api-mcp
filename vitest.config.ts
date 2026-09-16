import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['test/unit/**/*.test.ts', 'test/integration/privacy-smoke.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    poolOptions: {
      workers: {
        // Unit tools/filters do not rely on Durable Object / KV isolation; WAL
        // -shm sidecars break isolatedStorage on some Linux tmp setups.
        isolatedStorage: false,
        singleWorker: true,
        wrangler: {
          configPath: './wrangler.jsonc',
        },
      },
    },
  },
});
