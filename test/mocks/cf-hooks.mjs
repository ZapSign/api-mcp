/**
 * Node.js ESM customization hooks for Vitest.
 * Intercepts `cloudflare:*` protocol specifiers before Node's default loader
 * rejects them, redirecting to stub files in test/mocks/.
 */
import { fileURLToPath } from 'node:url';

const STUBS = {
  'cloudflare:workers': new URL('./cloudflare-workers.ts', import.meta.url).href,
  'cloudflare:email': new URL('./cloudflare-email.ts', import.meta.url).href,
};

export function resolve(specifier, context, nextResolve) {
  if (specifier in STUBS) {
    return nextResolve(STUBS[specifier], context);
  }
  return nextResolve(specifier, context);
}
