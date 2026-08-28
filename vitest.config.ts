import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc',
        },
      },
    },
  },
});
