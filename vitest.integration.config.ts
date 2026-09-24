import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = './test/.env.test';
const CLOUDFLARE_TEST_MODULES: Readonly<Record<string, string>> = {
  'cloudflare:email': fileURLToPath(new URL('./test/mocks/cloudflare-email.mjs', import.meta.url)),
  'cloudflare:workers': fileURLToPath(new URL('./test/mocks/cloudflare-workers.mjs', import.meta.url)),
};

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    process.env[key] ??= value;
  }
}

export default defineConfig({
  plugins: [{
    name: 'resolve-cloudflare-test-modules',
    enforce: 'pre',
    resolveId(source) {
      return CLOUDFLARE_TEST_MODULES[source] ?? null;
    },
  }],
  ssr: {
    noExternal: ['agents', '@cloudflare/workers-oauth-provider'],
  },
  test: {
    environment: 'node',
    include: ['test/integration/sandbox.test.ts', 'test/integration/privacy-smoke.test.ts'],
    server: {
      deps: {
        inline: ['agents', '@cloudflare/workers-oauth-provider'],
      },
    },
  },
});
