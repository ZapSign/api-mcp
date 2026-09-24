/**
 * Node.js ESM loader hook that intercepts `cloudflare:*` protocol imports
 * and redirects them to stub implementations for testing.
 * Loaded via --import in vitest poolOptions.forks.execArgv / poolOptions.threads.execArgv.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./cf-hooks.mjs', import.meta.url);
