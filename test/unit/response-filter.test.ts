import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  BANNED_DOCUMENT_KEYS,
  BANNED_SIGNER_KEYS,
  filterDocument,
  filterSigner,
  filterTemplate,
  OWNER_CREATE_OPTIONS,
  OWNER_READ_OPTIONS,
} from '../../src/utils/response-filter.js';

const PRODUCTION_SHAPED_SIGNER = {
  token: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  status: 'signed',
  status_code: 3,
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone_country: '55',
  phone_number: '11999887766',
  cpf: '12345678900',
  cnpj: '12345678000199',
  times_viewed: 4,
  last_view_at: '2026-03-01T12:00:00Z',
  signed_at: '2026-03-01T12:05:00Z',
  sign_url: 'https://app.zapsign.com.br/verificar/c3d4e5f6-a7b8-9012-cdef-123456789012',
  signing_link: 'https://app.zapsign.com.br/verificar/c3d4e5f6-a7b8-9012-cdef-123456789012',
  auth_mode: 'assinaturaTela',
  qualification: 'Contratante',
  selfie_photo_url: 'https://cdn.example/selfie.jpg',
  selfie_photo_url2: 'https://cdn.example/selfie2.jpg',
  liveness_photo_url: 'https://cdn.example/liveness.jpg',
  document_photo_url: 'https://cdn.example/doc.jpg',
  document_verse_photo_url: 'https://cdn.example/doc-verse.jpg',
  selfie_validation_type: 'face-match',
  signature_image: 'https://cdn.example/signature.png',
  geo_latitude: '-23.5505',
  geo_longitude: '-46.6333',
  ip: '203.0.113.10',
  digital_certificate: { serial: 'abc' },
  uploaded_files: [{ url: 'https://cdn.example/id.pdf' }],
  delegator: { name: 'Boss' },
  sent_sms_link: true,
  resend_attempts: { whatsapp: 1, email: 2, sms: 0 },
  visto_image: 'https://cdn.example/visto.png',
};

const PRODUCTION_SHAPED_DOCUMENT = {
  open_id: 100001,
  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  status: 'pending',
  name: 'Contrato de Prestação de Serviços',
  original_file: 'https://zapsign.s3.amazonaws.com/pdf/original/doc.pdf',
  original_file_hash: 'sha256:deadbeef',
  signed_file: null,
  created_at: '2026-02-28T10:00:00Z',
  last_update_at: '2026-02-28T10:00:00Z',
  sandbox: true,
  external_id: 'ext-001',
  created_by: { email: 'joao@example.com' },
  deleted_at: null,
  answers: [
    { variable: '{{cpf}}', value: '12345678900' },
    { name: 'salary', value: '' },
  ],
  metadata: [
    { key: 'customer_email', value: 'customer@example.com' },
    { key: 'internal_note', value: 'vip' },
  ],
  signers: [PRODUCTION_SHAPED_SIGNER],
};

const PRODUCTION_SHAPED_TEMPLATE = {
  token: 'e5f6a7b8-c9d0-1234-efab-345678901234',
  template_type: 'docx',
  name: 'Modelo de Contrato',
  active: true,
  template_file: 'https://zapsign.s3.amazonaws.com/templates/t.docx',
  created_at: '2026-01-15T09:00:00Z',
  last_update_at: '2026-02-20T11:30:00Z',
  lang: 'pt-br',
  folder_path: '/templates',
  inputs: [
    {
      variable: '{{nome_completo}}',
      input_type: 'text',
      label: 'Nome Completo',
      help_text: 'Nome',
      required: true,
      order: 1,
      value: 'should-never-leak',
    },
  ],
  signers: [
    {
      name: 'Signatário',
      auth_mode: 'assinaturaTela',
      email: 'signer@example.com',
      phone_number: '11999999999',
      cpf: '12345678900',
    },
  ],
};

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, keys);
    }
    return keys;
  }

  if (typeof value !== 'object' || value === null) {
    return keys;
  }

  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

describe('response-filter allowlist', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should keep owner email and strip banned signer fields on read', () => {
    const filtered = filterSigner(PRODUCTION_SHAPED_SIGNER, OWNER_READ_OPTIONS);
    const keys = collectKeys(filtered);

    expect(filtered).toEqual({
      token: PRODUCTION_SHAPED_SIGNER.token,
      name: 'Maria Silva',
      status: 'signed',
      status_code: 3,
      signed_at: '2026-03-01T12:05:00Z',
      qualification: 'Contratante',
      auth_mode: 'assinaturaTela',
      email: 'maria@example.com',
    });
    expect(keys.has('sign_url')).toBe(false);
    expect(keys.has('signing_link')).toBe(false);
    for (const banned of BANNED_SIGNER_KEYS) {
      expect(keys.has(banned)).toBe(false);
    }
  });

  it('should include sign_url only when create options are set', () => {
    const filtered = filterSigner(PRODUCTION_SHAPED_SIGNER, OWNER_CREATE_OPTIONS) as Record<
      string,
      unknown
    >;

    expect(filtered.sign_url).toBe(PRODUCTION_SHAPED_SIGNER.sign_url);
    expect(filtered.signing_link).toBe(PRODUCTION_SHAPED_SIGNER.signing_link);
    expect(filtered.cpf).toBeUndefined();
  });

  it('should omit email when includeEmail is false', () => {
    const filtered = filterSigner(PRODUCTION_SHAPED_SIGNER, {
      includeEmail: false,
      includeSignUrl: false,
    }) as Record<string, unknown>;

    expect(filtered.email).toBeUndefined();
    expect(filtered.name).toBe('Maria Silva');
  });

  it('should project documents without banned keys or answer values', () => {
    const filtered = filterDocument(PRODUCTION_SHAPED_DOCUMENT, OWNER_READ_OPTIONS) as Record<
      string,
      unknown
    >;
    const keys = collectKeys(filtered);
    const serialized = JSON.stringify(filtered);

    expect(filtered.token).toBe(PRODUCTION_SHAPED_DOCUMENT.token);
    expect(filtered.name).toBe(PRODUCTION_SHAPED_DOCUMENT.name);
    expect(filtered.signed_count).toBe(1);
    expect(filtered.answers_count).toBe(2);
    expect(filtered.answers_filled).toEqual([
      { name: '{{cpf}}', filled: true },
      { name: 'salary', filled: false },
    ]);
    expect(filtered.metadata_count).toBe(2);
    expect(filtered.metadata_filled).toEqual([
      { name: 'customer_email', filled: true },
      { name: 'internal_note', filled: true },
    ]);
    expect(filtered.answers).toBeUndefined();
    expect(filtered.metadata).toBeUndefined();
    expect(serialized).not.toContain('12345678900');
    expect(serialized).not.toContain('customer@example.com');
    expect(keys.has('sign_url')).toBe(false);

    for (const banned of BANNED_DOCUMENT_KEYS) {
      expect(keys.has(banned)).toBe(false);
    }
    for (const banned of BANNED_SIGNER_KEYS) {
      expect(keys.has(banned)).toBe(false);
    }
  });

  it('should keep sign_url on nested create document signers', () => {
    const filtered = filterDocument(PRODUCTION_SHAPED_DOCUMENT, OWNER_CREATE_OPTIONS) as Record<
      string,
      unknown
    >;
    const signers = filtered.signers as Array<Record<string, unknown>>;

    expect(signers[0]?.sign_url).toBe(PRODUCTION_SHAPED_SIGNER.sign_url);
    expect(signers[0]?.cpf).toBeUndefined();
  });

  it('should project templates without contact or input values', () => {
    const filtered = filterTemplate(PRODUCTION_SHAPED_TEMPLATE, OWNER_READ_OPTIONS) as Record<
      string,
      unknown
    >;
    const keys = collectKeys(filtered);
    const serialized = JSON.stringify(filtered);

    expect(filtered.token).toBe(PRODUCTION_SHAPED_TEMPLATE.token);
    expect(filtered.inputs).toEqual([
      {
        variable: '{{nome_completo}}',
        input_type: 'text',
        label: 'Nome Completo',
        help_text: 'Nome',
        required: true,
        order: 1,
      },
    ]);
    expect(filtered.signers).toEqual([
      {
        name: 'Signatário',
        auth_mode: 'assinaturaTela',
        email: 'signer@example.com',
      },
    ]);
    expect(serialized).not.toContain('should-never-leak');
    expect(keys.has('phone_number')).toBe(false);
    expect(keys.has('cpf')).toBe(false);
    expect(keys.has('template_file')).toBe(false);
  });
});
