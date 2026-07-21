import { describe, expect, it } from 'vitest';

import { ZAPSIGN_ENDPOINTS } from '../../../src/api/endpoints.js';

describe('ZAPSIGN_ENDPOINTS', () => {
  it('keeps valid document tokens unchanged in detail paths', () => {
    expect(ZAPSIGN_ENDPOINTS.documentDetail('doc-123')).toBe(
      '/api/v1/docs/doc-123/',
    );
  });

  it('encodes document tokens as a single path segment', () => {
    expect(ZAPSIGN_ENDPOINTS.documentDetail('../document?query#fragment')).toBe(
      '/api/v1/docs/..%2Fdocument%3Fquery%23fragment/',
    );
  });

  it('encodes document tokens before adding a signer', () => {
    expect(ZAPSIGN_ENDPOINTS.documentAddSigner('../document?query#fragment')).toBe(
      '/api/v1/docs/..%2Fdocument%3Fquery%23fragment/add-signer/',
    );
  });

  it('encodes signer tokens as a single path segment', () => {
    expect(ZAPSIGN_ENDPOINTS.signerDetail('../signer?query#fragment')).toBe(
      '/api/v1/signers/..%2Fsigner%3Fquery%23fragment/',
    );
  });

  it('encodes signer tokens before removing a signer', () => {
    expect(ZAPSIGN_ENDPOINTS.signerRemove('../signer?query#fragment')).toBe(
      '/api/v1/signer/..%2Fsigner%3Fquery%23fragment/remove/',
    );
  });

  it('encodes template tokens as a single path segment', () => {
    expect(ZAPSIGN_ENDPOINTS.templateDetail('../template?query#fragment')).toBe(
      '/api/v1/templates/..%2Ftemplate%3Fquery%23fragment/',
    );
  });

  it('encodes document tokens for place-signatures and extra docs', () => {
    expect(ZAPSIGN_ENDPOINTS.documentPlaceSignatures('doc/1')).toBe(
      '/api/v1/docs/doc%2F1/place-signatures/',
    );
    expect(ZAPSIGN_ENDPOINTS.documentUploadExtraDoc('doc/1')).toBe(
      '/api/v1/docs/doc%2F1/upload-extra-doc/',
    );
  });

  it('exposes async document and template create paths', () => {
    expect(ZAPSIGN_ENDPOINTS.documentsAsync).toBe('/api/v1/docs/async/');
    expect(ZAPSIGN_ENDPOINTS.templateCreateDocAsync).toBe(
      '/api/v1/models/create-doc/async/',
    );
  });
});
