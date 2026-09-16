import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';

import { ZapSignClient } from '../../src/api/client.js';
import { registerGetDocumentTool } from '../../src/tools/documents/get-document.js';
import { registerListDocumentsTool } from '../../src/tools/documents/list-documents.js';
import { registerCreateDocumentTool } from '../../src/tools/documents/create-document.js';
import { registerGetSignerTool } from '../../src/tools/signers/get-signer.js';
import { registerAddSignerTool } from '../../src/tools/signers/add-signer.js';
import { registerGetTemplateTool } from '../../src/tools/templates/get-template.js';
import { registerListTemplatesTool } from '../../src/tools/templates/list-templates.js';
import {
  BANNED_DOCUMENT_KEYS,
  BANNED_SIGNER_KEYS,
} from '../../src/utils/response-filter.js';
import {
  MOCK_AUTH_PROPS,
  MOCK_ADDED_SIGNER,
  MOCK_CREATED_DOCUMENT,
  MOCK_DOCUMENT,
  MOCK_DOCUMENT_LIST,
  MOCK_SIGNER,
  MOCK_TEMPLATE,
  MOCK_TEMPLATE_LIST,
} from '../mocks/zapsign-responses.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

vi.mock('../../src/api/client.js', () => ({
  ZapSignClient: vi.fn(),
}));

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

const BANNED_KEYS = [
  ...BANNED_SIGNER_KEYS,
  ...BANNED_DOCUMENT_KEYS,
  'answers',
  'metadata',
  'signature_image',
  'selfie_photo_url',
] as const;

function captureHandler(registerFn: (server: unknown) => void): ToolHandler {
  let handler!: ToolHandler;
  const mockServer = {
    registerTool: (_name: string, _config: unknown, h: ToolHandler) => {
      handler = h;
    },
  };
  registerFn(mockServer);
  return handler;
}

function parseToolJson(result: ToolResult): unknown {
  expect(result.isError).toBeFalsy();
  return JSON.parse(result.content[0].text);
}

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

function assertNoBannedKeys(payload: unknown): void {
  const keys = collectKeys(payload);
  for (const banned of BANNED_KEYS) {
    expect(keys.has(banned)).toBe(false);
  }
}

const mockAuthContext = getMcpAuthContext as unknown as ReturnType<typeof vi.fn>;
const MockClient = ZapSignClient as unknown as ReturnType<typeof vi.fn>;

function withAuth(methods: Record<string, ReturnType<typeof vi.fn>>): void {
  mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
  MockClient.mockImplementation(() => methods);
}

const SENSITIVE_DOCUMENT = {
  ...MOCK_DOCUMENT,
  sandbox: true,
  original_file_hash: 'sha256:abc',
  answers: [{ variable: '{{cpf}}', value: '12345678900' }],
  metadata: [{ key: 'secret', value: 'top-secret' }],
  signers: [
    {
      ...MOCK_SIGNER,
      cpf: '12345678900',
      geo_latitude: '-23.5',
      signature_image: 'https://cdn.example/sig.png',
      sign_url: 'https://app.zapsign.com.br/verificar/read-should-strip',
    },
  ],
};

describe('privacy smoke (fixture-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should strip banned fields and sign_url from get_document', async () => {
    const handler = captureHandler(registerGetDocumentTool);
    withAuth({ getDocument: vi.fn().mockResolvedValue(SENSITIVE_DOCUMENT) });

    const payload = parseToolJson(await handler({ doc_token: SENSITIVE_DOCUMENT.token }));
    const keys = collectKeys(payload);
    const serialized = JSON.stringify(payload);

    assertNoBannedKeys(payload);
    expect(keys.has('sign_url')).toBe(false);
    expect(serialized).not.toContain('12345678900');
    expect(serialized).not.toContain('top-secret');
    expect(serialized).not.toContain('read-should-strip');
  });

  it('should strip banned fields from list_documents pages', async () => {
    const handler = captureHandler(registerListDocumentsTool);
    withAuth({
      listDocuments: vi.fn().mockResolvedValue({
        ...MOCK_DOCUMENT_LIST,
        results: [SENSITIVE_DOCUMENT],
      }),
    });

    const payload = parseToolJson(await handler({ page: 1 }));
    assertNoBannedKeys(payload);
    expect(collectKeys(payload).has('sign_url')).toBe(false);
  });

  it('should strip sign_url from get_signer reads', async () => {
    const handler = captureHandler(registerGetSignerTool);
    withAuth({
      getSigner: vi.fn().mockResolvedValue({
        ...MOCK_SIGNER,
        cpf: '12345678900',
        sign_url: 'https://app.zapsign.com.br/verificar/read-signer',
      }),
    });

    const payload = parseToolJson(await handler({ signer_token: MOCK_SIGNER.token }));
    const keys = collectKeys(payload);

    assertNoBannedKeys(payload);
    expect(keys.has('sign_url')).toBe(false);
    expect(keys.has('signing_link')).toBe(false);
  });

  it('should keep sign_url on add_signer create response only', async () => {
    const handler = captureHandler(registerAddSignerTool);
    withAuth({ addSigner: vi.fn().mockResolvedValue(MOCK_ADDED_SIGNER) });

    const payload = parseToolJson(
      await handler({
        doc_token: MOCK_DOCUMENT.token,
        name: MOCK_ADDED_SIGNER.name,
        email: MOCK_ADDED_SIGNER.email,
      }),
    ) as Record<string, unknown>;

    assertNoBannedKeys(payload);
    expect(payload.sign_url).toBe(MOCK_ADDED_SIGNER.sign_url);
  });

  it('should keep sign_url on create_document nested signers', async () => {
    const handler = captureHandler(registerCreateDocumentTool);
    withAuth({
      createDocument: vi.fn().mockResolvedValue({
        ...MOCK_CREATED_DOCUMENT,
        signers: [MOCK_ADDED_SIGNER],
      }),
    });

    const payload = parseToolJson(
      await handler({
        name: 'Privacy smoke create',
        url_pdf: 'https://example.com/sample.pdf',
        signers: [{ name: 'Ana Costa', email: 'ana@example.com' }],
      }),
    ) as Record<string, unknown>;
    const signers = payload.signers as Array<Record<string, unknown>>;

    assertNoBannedKeys(payload);
    expect(signers[0]?.sign_url).toBe(MOCK_ADDED_SIGNER.sign_url);
  });

  it('should omit banned fields from template reads', async () => {
    const getHandler = captureHandler(registerGetTemplateTool);
    const listHandler = captureHandler(registerListTemplatesTool);
    withAuth({
      getTemplate: vi.fn().mockResolvedValue({
        ...MOCK_TEMPLATE,
        signers: [
          {
            ...MOCK_TEMPLATE.signers[0],
            email: 'template-signer@example.com',
            phone_number: '11999999999',
            cpf: '12345678900',
          },
        ],
      }),
      listTemplates: vi.fn().mockResolvedValue(MOCK_TEMPLATE_LIST),
    });

    const getPayload = parseToolJson(await getHandler({ template_token: MOCK_TEMPLATE.token }));
    const listPayload = parseToolJson(await listHandler({ page: 1 }));

    assertNoBannedKeys(getPayload);
    assertNoBannedKeys(listPayload);
    expect(JSON.stringify(getPayload)).not.toContain('12345678900');
  });
});
