import { describe, expect, it } from 'vitest';

import {
  DeleteDocumentInputSchema,
  GetDocumentInputSchema,
  UpdateDocumentInputSchema,
} from '../../../src/tools/documents/schemas.js';
import {
  AddSignerInputSchema,
  DeleteSignerInputSchema,
  GetSignerInputSchema,
  UpdateSignerInputSchema,
} from '../../../src/tools/signers/schemas.js';
import {
  CreateFromTemplateInputSchema,
  GetTemplateInputSchema,
} from '../../../src/tools/templates/schemas.js';

const UNSAFE_TOKENS = ['../document', 'document?query=value', 'document#fragment'];

describe('path token schemas', () => {
  it.each(UNSAFE_TOKENS)('rejects unsafe document token %s', (docToken) => {
    expect(GetDocumentInputSchema.safeParse({ doc_token: docToken }).success).toBe(false);
    expect(UpdateDocumentInputSchema.safeParse({ doc_token: docToken }).success).toBe(false);
    expect(DeleteDocumentInputSchema.safeParse({ doc_token: docToken }).success).toBe(false);
    expect(AddSignerInputSchema.safeParse({ doc_token: docToken, name: 'Signer' }).success).toBe(false);
  });

  it.each(UNSAFE_TOKENS)('rejects unsafe signer token %s', (signerToken) => {
    expect(GetSignerInputSchema.safeParse({ signer_token: signerToken }).success).toBe(false);
    expect(UpdateSignerInputSchema.safeParse({ signer_token: signerToken }).success).toBe(false);
    expect(DeleteSignerInputSchema.safeParse({ signer_token: signerToken }).success).toBe(false);
  });

  it.each(UNSAFE_TOKENS)('rejects unsafe template token %s', (templateToken) => {
    expect(GetTemplateInputSchema.safeParse({ template_token: templateToken }).success).toBe(false);
    expect(CreateFromTemplateInputSchema.safeParse({
      template_token: templateToken,
      signer_name: 'Signer',
      data: {},
    }).success).toBe(false);
  });

  it('accepts existing valid token values', () => {
    expect(GetDocumentInputSchema.safeParse({ doc_token: 'doc-123' }).success).toBe(true);
    expect(GetSignerInputSchema.safeParse({ signer_token: 'signer-123' }).success).toBe(true);
    expect(GetTemplateInputSchema.safeParse({ template_token: 'template-123' }).success).toBe(true);
    expect(CreateFromTemplateInputSchema.safeParse({
      template_token: 'template-123',
      signer_name: 'Signer',
      data: {},
    }).success).toBe(true);
  });
});
