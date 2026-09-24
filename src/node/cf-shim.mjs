/**
 * ESM loader hook for the Node production server.
 * Intercepts `cloudflare:*` protocol imports from `agents` and stubs them
 * with no-op classes so the server boots without a Cloudflare runtime.
 *
 * Usage: node --import ./dist/node/cf-shim.mjs dist/node/main.js
 */
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SHIM_URL = pathToFileURL(fileURLToPath(new URL('./cf-shim-hooks.mjs', import.meta.url))).href;
register(SHIM_URL, import.meta.url);
