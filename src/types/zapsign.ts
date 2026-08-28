// ---------------------------------------------------------------------------
// Value objects (as const) — NOT TypeScript enums
// ---------------------------------------------------------------------------

export const DocumentStatus = {
  Pending: 'pending',
  Signed: 'signed',
  Refused: 'refused',
} as const;
export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const SignerStatus = {
  New: 'new',
  LinkOpened: 'link-opened',
  Signed: 'signed',
} as const;
export type SignerStatus = (typeof SignerStatus)[keyof typeof SignerStatus];

export const SortOrder = {
  Ascending: 'asc',
  Descending: 'desc',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const AuthMode = {
  ScreenSignature: 'assinaturaTela',
  EmailToken: 'tokenEmail',
  ScreenSignatureAndEmailToken: 'assinaturaTela-tokenEmail',
  SmsToken: 'tokenSms',
  ScreenSignatureAndSmsToken: 'assinaturaTela-tokenSms',
  WhatsappToken: 'tokenWhatsapp',
  ScreenSignatureAndWhatsappToken: 'assinaturaTela-tokenWhatsapp',
} as const;
export type AuthMode = (typeof AuthMode)[keyof typeof AuthMode];

// ---------------------------------------------------------------------------
// Response interfaces — derived from live ZapSign API docs
// ---------------------------------------------------------------------------

export interface ZapSignSignerResendAttempts {
  whatsapp: number;
  email: number;
  sms: number;
}

export interface ZapSignSigner {
  token: string;
  status: SignerStatus;
  name: string;
  email: string;
  phone_country: string;
  phone_number: string;
  times_viewed: number;
  last_view_at: string | null;
  signed_at: string | null;
  sign_url?: string;
  auth_mode: AuthMode;
  lock_name: boolean;
  lock_email: boolean;
  lock_phone: boolean;
  qualification: string;
  external_id: string;
  require_selfie_photo?: boolean;
  require_document_photo?: boolean;
  geo_latitude?: string | null;
  geo_longitude?: string | null;
  redirect_link?: string;
  resend_attempts?: ZapSignSignerResendAttempts | null;
  send_automatic_whatsapp_signed_file?: boolean | null;
}

export interface ZapSignExtraDoc {
  open_id: number;
  token: string;
  name: string;
  original_file: string;
  signed_file: string | null;
}

export interface ZapSignDocumentCreatedBy {
  email: string;
}

export interface ZapSignDocument {
  open_id: number;
  token: string;
  status: DocumentStatus;
  name: string;
  original_file: string;
  signed_file: string | null;
  created_at: string;
  last_update_at: string;
  signers: ZapSignSigner[];
  extra_docs?: ZapSignExtraDoc[];
  folder_path?: string;
  lang?: string;
  sandbox?: boolean;
  external_id?: string;
  created_through?: string;
  deleted?: boolean;
  deleted_at?: string | null;
  created_by?: ZapSignDocumentCreatedBy;
}

export interface ZapSignPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ZapSignTemplateInput {
  variable: string;
  input_type: string;
  label: string;
  help_text: string;
  options?: string;
  required: boolean;
  order: number;
}

export interface ZapSignTemplateSigner {
  name: string;
  auth_mode: AuthMode;
  email: string;
  phone_country: string;
  phone_number: string;
  lock_name: boolean;
  lock_phone: boolean;
  lock_email: boolean;
  hide_phone?: boolean;
  blank_phone?: boolean;
  hide_email?: boolean;
  blank_email?: boolean;
  require_selfie_photo?: boolean;
  require_document_photo?: boolean;
  selfie_validation_type?: string;
  qualification?: string;
}

export interface ZapSignTemplate {
  token: string;
  template_type: string;
  name: string;
  active: boolean;
  template_file: string;
  created_at: string;
  last_update_at: string;
  signers: ZapSignTemplateSigner[];
  inputs: ZapSignTemplateInput[];
  lang: string;
  redirect_link?: string;
  folder_path?: string;
}

// ---------------------------------------------------------------------------
// Request interfaces
// ---------------------------------------------------------------------------

export interface CreateSignerInput {
  name: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  custom_message?: string;
  auth_mode?: AuthMode;
  order_group?: number;
  lock_name?: boolean;
  lock_email?: boolean;
  lock_phone?: boolean;
  redirect_link?: string;
  qualification?: string;
  external_id?: string;
}

export interface DocumentMetadataEntry {
  key: string;
  value: string;
}

export interface CreateDocumentRequest {
  name: string;
  url_pdf?: string;
  url_docx?: string;
  base64_pdf?: string;
  signers: CreateSignerInput[];
  lang?: string;
  signature_order_active?: boolean;
  folder_path?: string;
  external_id?: string;
  async?: boolean;
  metadata?: DocumentMetadataEntry[];
}

export interface UpdateDocumentRequest {
  name?: string;
  date_limit_to_sign?: string;
  folder_path?: string;
  folder_token?: string;
  extra_docs?: Array<{
    token: string;
    name: string;
  }>;
}

export interface CreateFromTemplateRequest {
  template_token: string;
  signer_name: string;
  signer_email?: string;
  data: Record<string, string>;
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  async?: boolean;
}

export interface DeParaEntry {
  de: string;
  para: string;
}

export interface PlaceSignaturesRequest {
  doc_token: string;
  rubricas: Array<Record<string, unknown>>;
}

export interface AddExtraDocumentRequest {
  doc_token: string;
  name: string;
  url_pdf: string;
}

export interface AddExtraDocumentFromTemplateRequest {
  doc_token: string;
  template_id: string;
  data: DeParaEntry[];
}

export interface SignInBatchRequest {
  user_token: string;
  signer_tokens: string[];
}

export interface WebhookHeaderInput {
  name: string;
  value: string;
}

export interface CreateWebhookRequest {
  url: string;
  type: string;
  headers?: WebhookHeaderInput[];
}

export interface CreateWebhookHeaderRequest {
  webhook_id: number;
  headers: WebhookHeaderInput[];
}

export interface AddTimestampRequest {
  url: string;
}

export interface ReorderEnvelopeDocumentsRequest {
  envelope_token: string;
  documents_order: string[];
}

export interface ReprocessDocumentsWebhooksRequest {
  document_token: string;
  webhook_tokens?: string[];
  reason?: string;
  force_reprocess?: boolean;
}

export interface CreatePartnerAccountRequest {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
}

export interface UpdatePartnerPaymentStatusRequest {
  partner_token: string;
  payment_status: string;
  payment_method: string;
}

export interface CreateFromTemplateApiBody {
  template_id: string;
  signer_name: string;
  signer_email?: string;
  data: DeParaEntry[];
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  metadata?: DocumentMetadataEntry[];
}

export interface UpdateSignerRequest {
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
}

// ---------------------------------------------------------------------------
// Query parameter interfaces (used by client methods)
// ---------------------------------------------------------------------------

export interface ListDocumentsParams {
  page?: number;
  status?: DocumentStatus;
  folder_path?: string;
  created_from?: string;
  created_to?: string;
  sort_order?: SortOrder;
  deleted?: boolean;
}

export interface ListTemplatesParams {
  page?: number;
}
