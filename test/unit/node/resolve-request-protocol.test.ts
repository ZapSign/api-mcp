import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';

import { resolveRequestProtocol } from '../../../src/node/main.js';

function fakeRequest(options: {
  forwardedProto?: string | string[];
  encrypted?: boolean;
}): IncomingMessage {
  return {
    headers: options.forwardedProto === undefined
      ? {}
      : { 'x-forwarded-proto': options.forwardedProto },
    socket: { encrypted: options.encrypted ?? false },
  } as unknown as IncomingMessage;
}

describe('resolveRequestProtocol', () => {
  it('trusts X-Forwarded-Proto: https from the ALB even when the socket is plain HTTP', () => {
    const req = fakeRequest({ forwardedProto: 'https', encrypted: false });
    expect(resolveRequestProtocol(req)).toBe('https');
  });

  it('trusts X-Forwarded-Proto: http when present', () => {
    const req = fakeRequest({ forwardedProto: 'http', encrypted: false });
    expect(resolveRequestProtocol(req)).toBe('http');
  });

  it('takes only the first hop of a comma-separated X-Forwarded-Proto', () => {
    const req = fakeRequest({ forwardedProto: 'https, http', encrypted: false });
    expect(resolveRequestProtocol(req)).toBe('https');
  });

  it('handles X-Forwarded-Proto delivered as a header array', () => {
    const req = fakeRequest({ forwardedProto: ['https'], encrypted: false });
    expect(resolveRequestProtocol(req)).toBe('https');
  });

  it('falls back to the raw socket when X-Forwarded-Proto is absent (local/direct testing)', () => {
    expect(resolveRequestProtocol(fakeRequest({ encrypted: true }))).toBe('https');
    expect(resolveRequestProtocol(fakeRequest({ encrypted: false }))).toBe('http');
  });

  it('falls back to the socket when X-Forwarded-Proto has an unrecognized value', () => {
    const req = fakeRequest({ forwardedProto: 'ftp', encrypted: true });
    expect(resolveRequestProtocol(req)).toBe('https');
  });
});
