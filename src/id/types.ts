export interface IdAuthProps {
  userId: string;
  grantedScope: string;
}

export interface StoredIdTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
  expiresAt: number;
}

export interface IdApiErrorBody {
  error?: {
    type?: string;
    code?: string;
    message?: string;
    param?: string;
    doc_url?: string;
    request_id?: string;
  };
}

export interface PaginationParams {
  limit?: number;
  after?: string;
  before?: string;
}

export type ListValidationsParams = PaginationParams;

export interface ValidationListResponse {
  object: string;
  has_more: boolean;
  data: unknown[];
}

export interface ValidationResponse {
  object: string;
  id: string;
  type: string;
  status: string;
  result: string | null;
  reason_code: string | null;
  external_id: string | null;
  created_at: string;
  resolved_at: string | null;
  validation_url: string | null;
  expires_at: string | null;
  attempts_remaining: number | null;
  details: unknown;
}

export interface CpfPhoneMatchValidationInput {
  cpf: string;
  phone: string;
  consent: true;
  external_id?: string;
}

export interface SimSwapValidationInput {
  phone: string;
  consent: true;
  max_age_hours?: number;
  external_id?: string;
}

export interface LivenessDocumentMatchValidationInput {
  consent: true;
  redirect_url?: string;
  external_id?: string;
}

export interface PhoneOwnershipValidationInput {
  phone: string;
  consent: true;
  external_id?: string;
}

export interface ValidationVerificationInput {
  code: string;
}

export interface IdRequestOptions {
  idempotencyKey?: string;
}
