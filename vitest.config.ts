import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const CF_EMAIL = fileURLToPath(new URL('./test/mocks/cloudflare-email.mjs', import.meta.url));
const CF_WORKERS = fileURLToPath(new URL('./test/mocks/cloudflare-workers.mjs', import.meta.url));
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
        // --experimental-websocket is required on Node 20 (unflagged only in
        // Node 22+): the `agents`/`partyserver` packages reference the
        // global WebSocket constructor at module load time.
        execArgv: ['--import', CF_LOADER, '--experimental-websocket'],
      },
    },
    server: {
      deps: {
        inline: ['agents', '@cloudflare/workers-oauth-provider'],
      },
    },
  },
});
