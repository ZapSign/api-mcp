# OpenAI Apps Directory — Per-Tool Annotation Justifications (25 tools)

Paste-ready answers for the OpenAI Platform draft fields of the form
**“Describe why `<tool>` is set to `<hint>`…”** for `readOnlyHint`, `destructiveHint`,
`idempotentHint`, and `openWorldHint`.

Source of truth: `src/tools/**` annotations (verified 2026-08-14) and `src/tools/registry.ts`
(25 registered tools). Draft `asdk_app_6a7f4a126ab88191a83a67cf744ca7da`, version
`asdk_app_v_6a7f4a136fb08191abc40efc7e45c499`.

**Every tool in this server sets `openWorldHint: true`** because each call reaches the external
ZapSign REST API (`https://api.zapsign.com.br/api/v1`) over the public internet through
`ZapSignClient`; results depend on live account state that this app does not own or control.
A per-tool wording is still supplied below so no field is left blank.

## Response allowlist (applies to all tools)

Tool results are filtered through a **response allowlist** before they reach ChatGPT. Full field
tables, the `answers`/`metadata` fast path (counts/filled only), the `sign_url` create-only rule,
and the withheld categories (CPF/CNPJ, biometric/ID photos, geolocation, IP, digital certificates,
`sign_url` on reads) are documented in:

- [`openai.md`](./openai.md) § Expected response contract for resubmission (allowlist)
- [`docs/PRIVACY_POLICY.md`](../PRIVACY_POLICY.md) (published at `https://mcp.zapsign.com.br/privacy`)

When justifying read tools (`get_document`, `get_signer`, `list_documents`, `get_template`,
`list_templates`), reviewers should assume those responses never include withheld categories or
raw answer/metadata values. When justifying create tools (`create_document`, `add_signer`,
`create_from_template`), `sign_url` may appear only in that create response.

---

## Documents

### 1. `list_documents` — read-only, non-destructive, idempotent, open-world

- **readOnlyHint = true:** Performs a `GET` on the ZapSign documents collection and returns a paginated list. It requires only the `documents:read` scope and never creates, mutates, or removes account data.
- **destructiveHint = false:** Nothing is deleted or overwritten; the call has no side effects on documents, signers, or signing state.
- **idempotentHint = true:** Repeating the same query with the same filters returns the same page of results and causes no additional state change on the account.
- **openWorldHint = true:** The listing is fetched live from the external ZapSign API, so the content reflects the customer's real account and can change between calls.

### 2. `get_document` — read-only, non-destructive, idempotent, open-world

- **readOnlyHint = true:** A single `GET` by `doc_token` that returns document details and signer status under the `documents:read` scope; no write path exists in the handler.
- **destructiveHint = false:** Retrieval only; the document, its signers, and its signing progress are untouched.
- **idempotentHint = true:** Repeated reads of the same `doc_token` are safe and produce no cumulative effect (file URLs in the response simply expire after 60 minutes).
- **openWorldHint = true:** Document data lives in the external ZapSign platform and may be updated by signers or other users between calls.

### 3. `create_document` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Creates a new signature document from `url_pdf`, `url_docx`, or `base64_pdf` and requires the `documents:write` scope.
- **destructiveHint = false:** It only adds a new document; no existing document, signer, or template is modified or removed.
- **idempotentHint = false:** Each call creates a distinct document with a new token and new signing links, so repeating the call produces duplicate documents (and may trigger duplicate email/WhatsApp delivery to signers).
- **openWorldHint = true:** The document is created in the customer's external ZapSign account and can trigger real-world notifications to third-party signers.

### 4. `update_document` — write, non-destructive, idempotent, open-world

- **readOnlyHint = false:** Applies a partial update (name, signing deadline, folder, extra-document names) to an existing document under `documents:write`.
- **destructiveHint = false:** It edits metadata of a document the caller identifies by `doc_token`; it does not delete the document and does not touch signers.
- **idempotentHint = true:** The update sets fields to the supplied values, so re-sending the same payload converges to the same document state without additional effects.
- **openWorldHint = true:** The mutation is applied to live data in the external ZapSign account, whose current state is not known to the model in advance.

### 5. `delete_document` — write, destructive, non-idempotent, open-world

- **readOnlyHint = false:** Issues a delete against the ZapSign documents endpoint and requires `documents:write`.
- **destructiveHint = true:** It removes a document from the customer's account, which ends its availability in the signing workflow and cannot be undone from this app.
- **idempotentHint = false:** Only the first call removes the document; subsequent calls with the same `doc_token` fail with a not-found/unsupported-state error rather than succeeding unchanged.
- **openWorldHint = true:** The deletion targets real records in the external ZapSign platform, and ZapSign may reject the removal depending on the document's live state.

### 6. `place_signatures` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Writes positioned signature fields (rubricas) onto an existing document under `documents:write`.
- **destructiveHint = false:** It adds signature placements; existing document content and signer records are preserved.
- **idempotentHint = false:** Each call appends new placement entries, so repeating it can stack duplicate signature boxes on the same page coordinates.
- **openWorldHint = true:** Placement is applied to a live document in the external ZapSign account and depends on that document's current pages and signers.

### 7. `add_extra_document` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Uploads an additional PDF attachment to an existing signing package under `documents:write`.
- **destructiveHint = false:** The main document and the previously attached files are kept; the call only adds a new attachment.
- **idempotentHint = false:** Calling it twice with the same file attaches the same PDF twice, since each upload creates a new extra document entry.
- **openWorldHint = true:** The upload targets an external ZapSign document and typically fetches the file from a public URL on the open internet.

### 8. `add_extra_document_from_template` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Generates a new extra document from a template and attaches it to a parent document; requires `documents:write` and `templates:write`.
- **destructiveHint = false:** The parent document and the source template are unchanged; only a new generated attachment is added.
- **idempotentHint = false:** Every call renders and attaches another copy of the template, so repeats create duplicate extra documents.
- **openWorldHint = true:** Both the template and the parent document live in the customer's external ZapSign account, whose contents can change independently.

### 9. `add_timestamp` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Requests a cryptographic timestamp to be applied to a document, which changes the stored artifact; requires `documents:write`.
- **destructiveHint = false:** Timestamping augments the audit evidence of the document; no existing content, signature, or signer is removed.
- **idempotentHint = false:** Each call produces a new timestamp token bound to the moment of the request, so repeated calls are not equivalent to a single one.
- **openWorldHint = true:** The operation runs against the external ZapSign service and a document reachable at a public URL, and it depends on a trusted third-party time source.

### 10. `reorder_envelope_documents` — write, non-destructive, idempotent, open-world

- **readOnlyHint = false:** Persists a new display order for the documents inside an envelope under `documents:write`.
- **destructiveHint = false:** Reordering rearranges references only; no document is deleted and no signature data is lost.
- **idempotentHint = true:** The call sets the ordering to the exact `documents_order` list supplied, so re-sending the same list leaves the envelope in the same state.
- **openWorldHint = true:** The envelope and its member documents are live objects in the external ZapSign account.

---

## Signers

### 11. `add_signer` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Adds a signer to an existing document and returns a new signer token and signing link; requires `signers:write`.
- **destructiveHint = false:** Existing signers and the document itself are preserved; the call only appends a participant.
- **idempotentHint = false:** Repeating the call adds another signer record with a different token, and can send duplicate email/WhatsApp signing invitations.
- **openWorldHint = true:** The signer is created in the external ZapSign account and the invitation is delivered to a real third-party recipient.

### 12. `get_signer` — read-only, non-destructive, idempotent, open-world

- **readOnlyHint = true:** Reads a single signer's status, authentication mode, view count, and optional geolocation under `signers:read`.
- **destructiveHint = false:** Pure retrieval; the signer record and the signing workflow are unaffected.
- **idempotentHint = true:** Repeated reads of the same `signer_token` return the current state without accumulating any side effect.
- **openWorldHint = true:** Signer status is owned by the external ZapSign platform and changes whenever the real person views or signs the document.

### 13. `update_signer` — write, non-destructive, idempotent, open-world

- **readOnlyHint = false:** Updates a signer's name, email, or phone before signing; requires `signers:write`.
- **destructiveHint = false:** The signer record is edited in place and remains attached to the document; nothing is removed.
- **idempotentHint = true:** The call assigns the provided contact values, so applying the same payload repeatedly leaves the signer in the same state.
- **openWorldHint = true:** The change is applied to a live signer in the external ZapSign account, and ZapSign rejects it once that person has already signed.

### 14. `delete_signer` — write, destructive, non-idempotent, open-world

- **readOnlyHint = false:** Removes a signer from a document by `signer_token` under `signers:write`.
- **destructiveHint = true:** The signer is detached from the document and their pending signing link stops working, which cannot be reversed from this app.
- **idempotentHint = false:** Only the first call succeeds; afterwards the token no longer resolves, and ZapSign also refuses removal when the signer has signed or is the document's last signer.
- **openWorldHint = true:** The removal affects a real participant in the customer's external ZapSign account and depends on that document's live signing state.

### 15. `sign_in_batch` — write, destructive, non-idempotent, open-world

- **readOnlyHint = false:** Executes signatures for multiple documents in a single request using a `user_token` and a list of signer tokens; requires `signers:write`.
- **destructiveHint = true:** Signing records legally meaningful signatures on multiple documents; this action cannot be undone by the connector even though it does not delete documents or signer records.
- **idempotentHint = false:** The first call records the signatures and changes document status; repeat calls are rejected or act on a different set of pending documents.
- **openWorldHint = true:** Signatures are registered on the external ZapSign platform and are legally meaningful actions on real documents.

---

## Templates

### 16. `list_templates` — read-only, non-destructive, idempotent, open-world

- **readOnlyHint = true:** Returns a paginated list of the account's templates under `templates:read`, with no write path in the handler.
- **destructiveHint = false:** Retrieval only; no template is created, edited, or deleted.
- **idempotentHint = true:** The same query returns the same page and leaves the account unchanged.
- **openWorldHint = true:** Templates are stored in the customer's external ZapSign account and can be edited there at any time.

### 17. `get_template` — read-only, non-destructive, idempotent, open-world

- **readOnlyHint = true:** Reads one template with its dynamic fields (`inputs[].variable`) under `templates:read` so the correct variables can be filled later.
- **destructiveHint = false:** Inspection only; the template definition is not modified.
- **idempotentHint = true:** Repeated reads of the same template token are equivalent to a single read.
- **openWorldHint = true:** The template definition lives in the external ZapSign account and may differ from anything cached in the conversation.

### 18. `create_from_template` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Renders a DOCX template into a new signature document with the supplied dynamic-field values; requires `templates:write`.
- **destructiveHint = false:** The source template is untouched and no existing document is replaced; only a new document is produced.
- **idempotentHint = false:** Each call generates another document with a new token and new signing links, so repeats create duplicates and may resend invitations.
- **openWorldHint = true:** The document is created in the customer's external ZapSign account and can trigger real email or WhatsApp delivery to signers.

---

## Webhooks

### 19. `create_webhook` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Registers a company webhook endpoint for ZapSign event notifications under `webhooks:write`.
- **destructiveHint = false:** Existing webhooks keep working; the call only adds a new subscription.
- **idempotentHint = false:** ZapSign assigns a new webhook ID per call, so repeating it registers duplicate subscriptions that each receive every event.
- **openWorldHint = true:** The subscription is created in the external ZapSign account and causes future deliveries to an arbitrary third-party HTTPS URL.

### 20. `delete_webhook` — write, destructive, idempotent, open-world

- **readOnlyHint = false:** Deletes a company webhook by numeric ID under `webhooks:write`.
- **destructiveHint = true:** Removing the subscription permanently stops event delivery to that URL, which can silently break downstream integrations.
- **idempotentHint = true:** The intended end state is "this webhook ID no longer exists", so repeating the call does not remove anything additional.
- **openWorldHint = true:** The webhook is configuration inside the external ZapSign account and governs traffic to a third-party endpoint.

### 21. `create_webhook_header` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Attaches custom HTTP headers to an existing webhook under `webhooks:write`.
- **destructiveHint = false:** Previously configured headers and the webhook itself are preserved; the call only adds entries.
- **idempotentHint = false:** Each call creates new header records with new IDs, so repeats accumulate duplicate headers on the same webhook.
- **openWorldHint = true:** The headers are stored in the external ZapSign account and are sent on future deliveries to a third-party endpoint.

### 22. `delete_webhook_header` — write, destructive, idempotent, open-world

- **readOnlyHint = false:** Deletes a webhook header by numeric ID under `webhooks:write`.
- **destructiveHint = true:** The header is permanently removed, which can break authentication on the receiving endpoint if it was a credential header.
- **idempotentHint = true:** The target state is the absence of that header ID, so repeating the call has no further effect.
- **openWorldHint = true:** The change applies to live webhook configuration in the external ZapSign account.

### 23. `reprocess_documents_webhooks` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Triggers redelivery of webhook events for a document under `webhooks:write`, which is an action rather than a query.
- **destructiveHint = false:** No configuration or document data is deleted; only previously emitted events are dispatched again.
- **idempotentHint = false:** Every call sends another round of deliveries, so repeats produce duplicate event traffic to the subscriber.
- **openWorldHint = true:** Redelivery is executed by the external ZapSign platform toward third-party endpoints outside this app's control.

---

## Partner

### 24. `create_partner_account` — write, non-destructive, non-idempotent, open-world

- **readOnlyHint = false:** Provisions a new partner company account and requires the `partner:write` scope plus partner privileges on the ZapSign token.
- **destructiveHint = false:** It creates a new account record; no existing partner, company, or document is modified or removed.
- **idempotentHint = false:** Each call provisions another distinct partner account, so repeats create duplicate companies.
- **openWorldHint = true:** Provisioning happens in the external ZapSign platform; non-partner tokens receive an actionable privilege error from the live API.

### 25. `update_partner_payment_status` — write, destructive, idempotent, open-world

- **readOnlyHint = false:** Writes a new payment status to a partner account under `partner:write`.
- **destructiveHint = true:** It overwrites live billing state, which can suspend or re-enable a partner company's access, so it is flagged for explicit confirmation.
- **idempotentHint = true:** The call sets the status to the supplied value, so re-sending the same `partner_token` and status converges to the same state.
- **openWorldHint = true:** Billing state is owned by the external ZapSign platform and affects a real partner company's service level.

---

## Quick reference

| # | Tool | readOnly | destructive | idempotent | openWorld |
|---|---|---|---|---|---|
| 1 | `list_documents` | true | false | true | true |
| 2 | `get_document` | true | false | true | true |
| 3 | `create_document` | false | false | false | true |
| 4 | `update_document` | false | false | true | true |
| 5 | `delete_document` | false | true | false | true |
| 6 | `place_signatures` | false | false | false | true |
| 7 | `add_extra_document` | false | false | false | true |
| 8 | `add_extra_document_from_template` | false | false | false | true |
| 9 | `add_timestamp` | false | false | false | true |
| 10 | `reorder_envelope_documents` | false | false | true | true |
| 11 | `add_signer` | false | false | false | true |
| 12 | `get_signer` | true | false | true | true |
| 13 | `update_signer` | false | false | true | true |
| 14 | `delete_signer` | false | true | false | true |
| 15 | `sign_in_batch` | false | false | false | true |
| 16 | `list_templates` | true | false | true | true |
| 17 | `get_template` | true | false | true | true |
| 18 | `create_from_template` | false | false | false | true |
| 19 | `create_webhook` | false | false | false | true |
| 20 | `delete_webhook` | false | true | true | true |
| 21 | `create_webhook_header` | false | false | false | true |
| 22 | `delete_webhook_header` | false | true | true | true |
| 23 | `reprocess_documents_webhooks` | false | false | false | true |
| 24 | `create_partner_account` | false | false | false | true |
| 25 | `update_partner_payment_status` | false | true | true | true |

Totals: 5 read-only, 20 write, 5 destructive, 11 idempotent, 25 open-world.
