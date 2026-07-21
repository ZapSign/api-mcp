export const ZAPSIGN_ENDPOINTS = {
  documents: '/api/v1/docs/',
  documentsAsync: '/api/v1/docs/async/',
  documentDetail: (token: string) => `/api/v1/docs/${encodeURIComponent(token)}/`,
  documentAddSigner: (docToken: string) =>
    `/api/v1/docs/${encodeURIComponent(docToken)}/add-signer/`,
  documentPlaceSignatures: (docToken: string) =>
    `/api/v1/docs/${encodeURIComponent(docToken)}/place-signatures/`,
  documentUploadExtraDoc: (docToken: string) =>
    `/api/v1/docs/${encodeURIComponent(docToken)}/upload-extra-doc/`,
  templateUploadExtraDoc: (docToken: string) =>
    `/api/v1/models/${encodeURIComponent(docToken)}/upload-extra-doc/`,
  signerDetail: (token: string) => `/api/v1/signers/${encodeURIComponent(token)}/`,
  signerRemove: (token: string) => `/api/v1/signer/${encodeURIComponent(token)}/remove/`,
  signBatch: '/api/v1/sign/',
  templates: '/api/v1/templates/',
  templateDetail: (token: string) => `/api/v1/templates/${encodeURIComponent(token)}/`,
  templateCreateDoc: '/api/v1/models/create-doc/',
  templateCreateDocAsync: '/api/v1/models/create-doc/async/',
  webhooks: '/api/v1/user/company/webhook/',
  webhookDelete: '/api/v1/user/company/webhook/delete/',
  webhookHeaders: '/api/v1/user/company/webhook/header/',
  webhookHeaderDelete: '/api/v1/user/company/webhook/header/delete/',
  timestamp: '/api/v1/timestamp/',
  envelopeReorder: (token: string) =>
    `/api/v1/envelopes/${encodeURIComponent(token)}/reorder/`,
  reprocess: '/api/v1/reprocess/',
  partners: '/api/v1/partners/',
  partnerPaymentStatus: (token: string) =>
    `/api/v1/partners/${encodeURIComponent(token)}/payment-status/`,
} as const;
