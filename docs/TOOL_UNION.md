# Tool union matrix (zapsign-mcp × api-mcp v1)

Canonical names are Workers/snake_case. Source `keep` = preserved Workers tool; `port` = new from api-mcp; `extend` = Workers tool gains api-mcp capability.

| MCP tool name | Scope | ZapSign endpoint | Source |
|---|---|---|---|
| `list_documents` | `documents:read` | `GET /api/v1/docs/` | keep (`get_docs`) |
| `get_document` | `documents:read` | `GET /api/v1/docs/{token}/` | keep (`detail_doc`) |
| `create_document` | `documents:write` | `POST /api/v1/docs/` or `/docs/async/` | extend (`create_doc_from_upload_pdf/docx/async`) |
| `update_document` | `documents:write` | `PUT /api/v1/docs/{token}/` | keep (Workers-only) |
| `delete_document` | `documents:write` | `DELETE /api/v1/docs/{token}/` | keep (`delete_doc`) |
| `add_signer` | `signers:write` | `POST /api/v1/docs/{token}/add-signer/` | keep |
| `get_signer` | `signers:read` | `GET /api/v1/signers/{token}/` | keep (`detail_signer`) |
| `update_signer` | `signers:write` | `POST /api/v1/signers/{token}/` | keep |
| `delete_signer` | `signers:write` | `DELETE /api/v1/signer/{token}/remove/` | keep |
| `list_templates` | `templates:read` | `GET /api/v1/templates/` | keep |
| `get_template` | `templates:read` | `GET /api/v1/templates/{token}/` | keep (`detail_template`) |
| `create_from_template` | `templates:write` (+ `documents:write`) | `POST /api/v1/models/create-doc/` or `/async/` | extend |
| `place_signatures` | `documents:write` | `POST /api/v1/docs/{token}/place-signatures/` | port |
| `add_extra_document` | `documents:write` | `POST /api/v1/docs/{token}/upload-extra-doc/` | port |
| `add_extra_document_from_template` | `documents:write` + `templates:write` | `POST /api/v1/models/{token}/upload-extra-doc/` | port |
| `sign_in_batch` | `signers:write` | `POST /api/v1/sign/` | port |
| `create_webhook` | `webhooks:write` | `POST /api/v1/user/company/webhook/` | port |
| `delete_webhook` | `webhooks:write` | `DELETE /api/v1/user/company/webhook/delete/` | port |
| `create_webhook_header` | `webhooks:write` | `POST /api/v1/user/company/webhook/header/` | port |
| `delete_webhook_header` | `webhooks:write` | `DELETE /api/v1/user/company/webhook/header/delete/` | port |
| `add_timestamp` | `documents:write` | `POST /api/v1/timestamp/` | port |
| `reorder_envelope_documents` | `documents:write` | `PUT /api/v1/envelopes/{token}/reorder/` | port |
| `reprocess_documents_webhooks` | `webhooks:write` | `POST /api/v1/reprocess/` | port |
| `create_partner_account` | `partner:write` | `POST /api/v1/partners/` | port |
| `update_partner_payment_status` | `partner:write` | `PUT /api/v1/partners/{token}/payment-status/` | port |

Dropped from old api-mcp README (not implemented): background-check tools.
