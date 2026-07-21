import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';
import { ZapSignClient } from '../../../src/api/client.js';
import { ZapSignMcpError } from '../../../src/errors/base.js';
import { logError, logToolError } from '../../../src/utils/logger.js';
import {
  MOCK_AUTH_PROPS,
  MOCK_TEMPLATE_LIST,
  MOCK_TEMPLATE,
  MOCK_CREATED_DOCUMENT,
  MOCK_UPDATED_DOCUMENT,
} from '../../mocks/zapsign-responses.js';
import { registerListTemplatesTool } from '../../../src/tools/templates/list-templates.js';
import { registerGetTemplateTool } from '../../../src/tools/templates/get-template.js';
import { registerCreateFromTemplateTool } from '../../../src/tools/templates/create-from-template.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

vi.mock('../../../src/api/client.js', () => ({
  ZapSignClient: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  log: vi.fn(),
  logError: vi.fn(),
  logToolError: vi.fn().mockReturnValue('test-error-id'),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

function expectUnexpectedError(result: ToolResult): void {
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toMatch(
    /An unexpected error occurred\. Please try again or contact support with error ID \[([a-f0-9]{12})\]\./,
  );
}

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

type ToolConfig = {
  description: string;
};

function captureToolConfig(registerFn: (server: unknown) => void): ToolConfig {
  let config: ToolConfig | undefined;
  const mockServer = {
    registerTool: (_name: string, registeredConfig: ToolConfig) => {
      config = registeredConfig;
    },
  };
  registerFn(mockServer);

  if (!config) {
    throw new Error('Tool configuration was not registered');
  }

  return config;
}

const mockAuthContext = getMcpAuthContext as unknown as ReturnType<typeof vi.fn>;
const MockClient = ZapSignClient as unknown as ReturnType<typeof vi.fn>;
const mockLogError = logError as unknown as ReturnType<typeof vi.fn>;
const mockLogToolError = logToolError as unknown as ReturnType<typeof vi.fn>;

function withAuth(methods: Record<string, ReturnType<typeof vi.fn>>): void {
  mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
  MockClient.mockImplementation(() => methods);
}

function withNoAuth(): void {
  mockAuthContext.mockReturnValue(null);
}

function withScope(scope: string): void {
  mockAuthContext.mockReturnValue({
    props: { ...MOCK_AUTH_PROPS, grantedScope: scope },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogToolError.mockReturnValue('abcdef123456');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// list_templates
// ---------------------------------------------------------------------------

describe('list_templates', () => {
  const handler = captureHandler(registerListTemplatesTool);

  it('should return paginated templates on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_TEMPLATE_LIST);
    withAuth({ listTemplates: mockFn });

    const result = await handler({ page: 1 });

    expect(mockFn).toHaveBeenCalledWith({ page: 1 });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_TEMPLATE_LIST) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when templates:read not granted', async () => {
    withScope('documents:read');

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('templates:read');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Unauthorized', 'unauthorized', 401, false),
    );
    withAuth({ listTemplates: mockFn });

    const result = await handler({ page: 1 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Unauthorized');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));
    withAuth({ listTemplates: mockFn });

    const result = await handler({ page: 1 });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// get_template
// ---------------------------------------------------------------------------

describe('get_template', () => {
  const handler = captureHandler(registerGetTemplateTool);

  it('should return template details on success', async () => {
    const mockFn = vi.fn().mockResolvedValue(MOCK_TEMPLATE);
    withAuth({ getTemplate: mockFn });

    const result = await handler({ template_token: 'tpl-tk' });

    expect(mockFn).toHaveBeenCalledWith('tpl-tk');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_TEMPLATE) }],
    });
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler({ template_token: 'tpl-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when templates:read not granted', async () => {
    withScope('documents:read');

    const result = await handler({ template_token: 'tpl-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('templates:read');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Template not found', 'not_found', 404, false),
    );
    withAuth({ getTemplate: mockFn });

    const result = await handler({ template_token: 'bad-tk' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Template not found');
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new TypeError('unexpected'));
    withAuth({ getTemplate: mockFn });

    const result = await handler({ template_token: 'tpl-tk' });

    expectUnexpectedError(result);
  });
});

// ---------------------------------------------------------------------------
// create_from_template
// ---------------------------------------------------------------------------

describe('create_from_template', () => {
  const handler = captureHandler(registerCreateFromTemplateTool);
  const config = captureToolConfig(registerCreateFromTemplateTool);
  const templateArgs = {
    template_token: 'tpl-tk',
    signer_name: 'Test Signer',
    data: { '{{nome_completo}}': 'Maria Silva' },
  };

  it('should describe template_token as the token returned by list_templates', () => {
    expect(config.description).toContain('template_token');
    expect(config.description).toContain('list_templates');
    expect(config.description).toContain('results[].token');
  });

  it('should describe data keys as exact braced template input variables', () => {
    expect(config.description).toContain('get_template');
    expect(config.description).toContain('exact braced strings');
    expect(config.description).toContain('inputs[].variable');
    expect(config.description).toContain('{{nome_completo}}');
  });

  it('should create once without updating when name is omitted', async () => {
    const createFromTemplate = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    const updateDocument = vi.fn();
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler(templateArgs);

    expect(createFromTemplate).toHaveBeenCalledOnce();
    expect(createFromTemplate).toHaveBeenCalledWith(templateArgs);
    expect(updateDocument).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_CREATED_DOCUMENT) }],
    });
  });

  it('should create without name then return the renamed document', async () => {
    const createFromTemplate = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    const updateDocument = vi.fn().mockResolvedValue(MOCK_UPDATED_DOCUMENT);
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler({ ...templateArgs, name: 'Custom Contract' });

    expect(createFromTemplate).toHaveBeenCalledWith(templateArgs);
    expect(updateDocument).toHaveBeenCalledOnce();
    expect(updateDocument).toHaveBeenCalledWith(MOCK_CREATED_DOCUMENT.token, {
      name: 'Custom Contract',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(MOCK_UPDATED_DOCUMENT) }],
    });
  });

  it('should trim the custom name before updating the document', async () => {
    const createFromTemplate = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    const updateDocument = vi.fn().mockResolvedValue(MOCK_UPDATED_DOCUMENT);
    withAuth({ createFromTemplate, updateDocument });

    await handler({ ...templateArgs, name: '  Custom Contract  ' });

    expect(updateDocument).toHaveBeenCalledWith(MOCK_CREATED_DOCUMENT.token, {
      name: 'Custom Contract',
    });
  });

  it('should reject an empty custom name before calling ZapSign', async () => {
    const createFromTemplate = vi.fn();
    const updateDocument = vi.fn();
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler({ ...templateArgs, name: '   ' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/name.*empty/i);
    expect(createFromTemplate).not.toHaveBeenCalled();
    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should reject a custom name longer than 255 characters before calling ZapSign', async () => {
    const createFromTemplate = vi.fn();
    const updateDocument = vi.fn();
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler({ ...templateArgs, name: 'a'.repeat(256) });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('255');
    expect(createFromTemplate).not.toHaveBeenCalled();
    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should return auth error when context is missing', async () => {
    withNoAuth();

    const result = await handler(templateArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication required');
  });

  it('should return scope error when templates:write not granted', async () => {
    withScope('templates:read');

    const result = await handler(templateArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('templates:write');
  });

  it('should return error message on ZapSignMcpError', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Invalid template variables', 'bad_request', 400, false),
    );
    withAuth({ createFromTemplate: mockFn });

    const result = await handler(templateArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Invalid template variables');
  });

  it('should not update when document creation fails with a custom name', async () => {
    const createFromTemplate = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Unable to create document', 'bad_request', 400, false),
    );
    const updateDocument = vi.fn();
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler({ ...templateArgs, name: 'Custom Contract' });

    expect(result.content[0].text).toBe('Unable to create document');
    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should return the created token and log once when renaming fails', async () => {
    const createFromTemplate = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    const updateDocument = vi.fn().mockRejectedValue(
      new ZapSignMcpError('Rename failed', 'server_error', 500, true),
    );
    withAuth({ createFromTemplate, updateDocument });

    const result = await handler({ ...templateArgs, name: 'Custom Contract' });

    expect(updateDocument).toHaveBeenCalledOnce();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      `Document created with token ${MOCK_CREATED_DOCUMENT.token}, but setting its name failed. Retry update_document with this token.`,
    );
    expect(mockLogError).toHaveBeenCalledWith(
      'document_from_template_name_failed',
      expect.objectContaining({ error_class: 'ZapSignMcpError', status_code: 500 }),
    );
    expect(JSON.stringify(mockLogError.mock.calls)).not.toContain(MOCK_CREATED_DOCUMENT.token);
    expect(JSON.stringify(mockLogError.mock.calls)).not.toContain('Custom Contract');
  });

  it('should require documents:write before creating a document with a custom name', async () => {
    const createFromTemplate = vi.fn();
    const updateDocument = vi.fn();
    withAuth({ createFromTemplate, updateDocument });
    withScope('templates:write');

    const result = await handler({ ...templateArgs, name: 'Custom Contract' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('documents:write');
    expect(createFromTemplate).not.toHaveBeenCalled();
    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should return generic error on unknown error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('render failed'));
    withAuth({ createFromTemplate: mockFn });

    const result = await handler(templateArgs);

    expectUnexpectedError(result);
  });

  it('should preserve notification flags and data without sending name to create', async () => {
    const createFromTemplate = vi.fn().mockResolvedValue(MOCK_CREATED_DOCUMENT);
    const updateDocument = vi.fn().mockResolvedValue(MOCK_UPDATED_DOCUMENT);
    withAuth({ createFromTemplate, updateDocument });

    const argsWithNotifications = {
      ...templateArgs,
      name: 'Custom Contract',
      send_automatic_email: true,
      send_automatic_whatsapp: true,
    };
    await handler(argsWithNotifications);

    expect(createFromTemplate).toHaveBeenCalledWith({
      ...templateArgs,
      send_automatic_email: true,
      send_automatic_whatsapp: true,
    });
  });
});
