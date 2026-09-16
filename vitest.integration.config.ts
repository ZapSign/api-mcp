import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'node:fs';

const envPath = './test/.env.test';

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
  test: {
    include: ['test/integration/sandbox.test.ts', 'test/integration/privacy-smoke.test.ts'],
  },
});
