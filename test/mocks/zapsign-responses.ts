import type {
  ZapSignSigner,
  ZapSignDocument,
  ZapSignPaginatedResponse,
  ZapSignTemplate,
  ZapSignTemplateInput,
  ZapSignTemplateSigner,
} from '../../src/types/zapsign.js';
import type { AuthProps } from '../../src/auth/types.js';

// ---------------------------------------------------------------------------
// Tokens & IDs (realistic UUID-v4 format)
// ---------------------------------------------------------------------------

const DOC_TOKEN_1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const DOC_TOKEN_2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const SIGNER_TOKEN_1 = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const SIGNER_TOKEN_2 = 'd4e5f6a7-b8c9-0123-defa-234567890123';
const TEMPLATE_TOKEN_1 = 'e5f6a7b8-c9d0-1234-efab-345678901234';
const TEMPLATE_TOKEN_2 = 'f6a7b8c9-d0e1-2345-fabc-456789012345';
// ---------------------------------------------------------------------------
// Auth mocks
// ---------------------------------------------------------------------------

export const MOCK_API_TOKEN = '4cb584dd-0e80-425b-96f5-fbe9354a5e5c0727c600-b90a-4984-8f8f-2b258e08d957';

export const MOCK_AUTH_PROPS: AuthProps = {
  userId: 'a1b2c3d4e5f6a7b8',
  zapSignApiUrl: 'https://sandbox.api.zapsign.com.br',
  zapSignApiToken: MOCK_API_TOKEN,
  grantedScope: 'documents:read documents:write signers:read signers:write templates:read templates:write webhooks:read webhooks:write partner:write',
};

// ---------------------------------------------------------------------------
// Signers
// ---------------------------------------------------------------------------

export const MOCK_SIGNER: ZapSignSigner = {
  token: SIGNER_TOKEN_1,
  status: 'new',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone_country: '55',
  phone_number: '11999887766',
  times_viewed: 0,
  last_view_at: null,
  signed_at: null,
  sign_url: `https://app.zapsign.com.br/verificar/${SIGNER_TOKEN_1}`,
  auth_mode: 'assinaturaTela',
  lock_name: false,
  lock_email: false,
  lock_phone: false,
  qualification: '',
  external_id: '',
};

export const MOCK_SIGNED_SIGNER: ZapSignSigner = {
  ...MOCK_SIGNER,
  token: SIGNER_TOKEN_2,
  status: 'signed',
  name: 'Carlos Oliveira',
  email: 'carlos@example.com',
  times_viewed: 3,
  last_view_at: '2026-02-27T15:30:00Z',
  signed_at: '2026-02-27T16:00:00Z',
  sign_url: undefined,
  geo_latitude: '-23.5505',
  geo_longitude: '-46.6333',
};

export const MOCK_ADDED_SIGNER: ZapSignSigner = {
  ...MOCK_SIGNER,
  name: 'Ana Costa',
  email: 'ana@example.com',
  sign_url: `https://app.zapsign.com.br/verificar/${SIGNER_TOKEN_1}`,
};

export const MOCK_UPDATED_SIGNER: ZapSignSigner = {
  ...MOCK_SIGNER,
  name: 'Maria Santos',
  email: 'maria.santos@example.com',
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const MOCK_DOCUMENT: ZapSignDocument = {
  open_id: 100001,
  token: DOC_TOKEN_1,
  status: 'pending',
  name: 'Contrato de Prestação de Serviços',
  original_file: `https://zapsign.s3.amazonaws.com/pdf/original/${DOC_TOKEN_1}.pdf`,
  signed_file: null,
  created_at: '2026-02-28T10:00:00Z',
  last_update_at: '2026-02-28T10:00:00Z',
  signers: [MOCK_SIGNER],
  folder_path: '/contratos/2026',
  lang: 'pt-br',
  sandbox: true,
  external_id: 'ext-001',
  created_through: 'api',
  deleted: false,
  deleted_at: null,
  created_by: { email: 'joao@example.com' },
};

export const MOCK_SIGNED_DOCUMENT: ZapSignDocument = {
  ...MOCK_DOCUMENT,
  token: DOC_TOKEN_2,
  open_id: 100002,
  status: 'signed',
  name: 'Acordo de Confidencialidade',
  signed_file: `https://zapsign.s3.amazonaws.com/pdf/signed/${DOC_TOKEN_2}.pdf`,
  last_update_at: '2026-02-27T16:05:00Z',
  signers: [MOCK_SIGNED_SIGNER],
};

export const MOCK_CREATED_DOCUMENT: ZapSignDocument = {
  ...MOCK_DOCUMENT,
  name: 'Novo Contrato de Trabalho',
  created_at: '2026-02-28T14:00:00Z',
  last_update_at: '2026-02-28T14:00:00Z',
};

export const MOCK_UPDATED_DOCUMENT: ZapSignDocument = {
  ...MOCK_DOCUMENT,
  name: 'Contrato Atualizado',
  folder_path: '/contratos/atualizado',
  last_update_at: '2026-02-28T15:00:00Z',
};

export const MOCK_DOCUMENT_LIST: ZapSignPaginatedResponse<ZapSignDocument> = {
  count: 5,
  next: 'https://sandbox.api.zapsign.com.br/api/v1/docs/?page=2',
  previous: null,
  results: [MOCK_DOCUMENT, MOCK_SIGNED_DOCUMENT],
};

export const MOCK_DELETE_RESPONSE = {
  detail: 'Document deleted successfully.',
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const MOCK_TEMPLATE_INPUT_NAME: ZapSignTemplateInput = {
  variable: '{{nome_completo}}',
  input_type: 'text',
  label: 'Nome Completo',
  help_text: 'Informe o nome completo do contratante',
  required: true,
  order: 1,
};

export const MOCK_TEMPLATE_INPUT_ADDRESS: ZapSignTemplateInput = {
  variable: '{{endereco}}',
  input_type: 'text',
  label: 'Endereço',
  help_text: 'Endereço completo com CEP',
  required: false,
  order: 2,
};

const MOCK_TEMPLATE_SIGNER: ZapSignTemplateSigner = {
  name: 'Signatário',
  auth_mode: 'assinaturaTela',
  email: '',
  phone_country: '55',
  phone_number: '',
  lock_name: false,
  lock_phone: false,
  lock_email: false,
};

export const MOCK_TEMPLATE: ZapSignTemplate = {
  token: TEMPLATE_TOKEN_1,
  template_type: 'docx',
  name: 'Modelo de Contrato de Serviço',
  active: true,
  template_file: `https://zapsign.s3.amazonaws.com/templates/${TEMPLATE_TOKEN_1}.docx`,
  created_at: '2026-01-15T09:00:00Z',
  last_update_at: '2026-02-20T11:30:00Z',
  signers: [MOCK_TEMPLATE_SIGNER],
  inputs: [MOCK_TEMPLATE_INPUT_NAME, MOCK_TEMPLATE_INPUT_ADDRESS],
  lang: 'pt-br',
  folder_path: '/templates',
};

export const MOCK_TEMPLATE_LIST: ZapSignPaginatedResponse<ZapSignTemplate> = {
  count: 2,
  next: null,
  previous: null,
  results: [
    MOCK_TEMPLATE,
    {
      ...MOCK_TEMPLATE,
      token: TEMPLATE_TOKEN_2,
      name: 'Modelo NDA',
      active: true,
      inputs: [MOCK_TEMPLATE_INPUT_NAME],
    },
  ],
};

// ---------------------------------------------------------------------------
// Error response bodies (as returned by ZapSign API)
// ---------------------------------------------------------------------------

export const MOCK_ERROR_400 = {
  detail: 'Invalid request payload.',
  errors: { name: ['This field is required.'] },
};

export const MOCK_ERROR_401 = {
  detail: 'Authentication credentials were not provided.',
};

export const MOCK_ERROR_403 = {
  detail: 'You do not have permission to perform this action.',
};

export const MOCK_ERROR_404 = {
  detail: 'Not found.',
};

export const MOCK_ERROR_429 = {
  detail: 'Request was throttled. Expected available in 60 seconds.',
};

export const MOCK_ERROR_500 = {
  detail: 'Internal server error.',
};
