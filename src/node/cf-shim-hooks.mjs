/**
 * ESM customization hooks — stubs cloudflare:* imports for Node.
 * Loaded via `node --import ./cf-shim.mjs`.
 */

const STUBS = {
  'cloudflare:workers': 'data:text/javascript,export class WorkerEntrypoint{} export class WorkflowEntrypoint{} export class DurableObject{} export const env={};',
  'cloudflare:email': 'data:text/javascript,export class EmailMessage{}',
};

export function resolve(specifier, context, nextResolve) {
  if (specifier in STUBS) {
    return { url: STUBS[specifier], shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (Object.values(STUBS).includes(url)) {
    const source = url.slice('data:text/javascript,'.length);
    return { format: 'module', source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
