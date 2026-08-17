---
name: track-signing-status
description: Find a ZapSign document, inspect its current signature status, and summarize who has signed and who is still pending.
---

# Track signing status

Use this skill when the user asks whether a ZapSign document is pending, signed, or refused, or wants a signer-by-signer status summary.

## Workflow

1. If the user provides a document token, call `get_document` with it.
2. If no token is provided, call `list_documents` with the user's stated filters. Use `status: pending` for requests specifically about outstanding signatures. Paginate only when needed to locate the document.
3. If multiple documents plausibly match, show their names, statuses, creation dates, and tokens, then ask the user which one to inspect.
4. Call `get_document` for the selected token to retrieve the authoritative current document and signer details.
5. Report:
   - Document name and overall status.
   - Each signer's name and current signing status.
   - Who is still pending, refused, or complete.
   - Any signing deadline present in the response.
6. When useful, suggest a supported next step such as updating a signer or retrieving the current signing link, but do not perform a write action unless the user asks.

## Rules

- Do not infer that a signer completed signing from message history or notification delivery. Use the latest tool response.
- Do not expose signer email addresses, phone numbers, document tokens, or signing links unless they are needed for the user's request.
- File URLs in `get_document` responses expire after 60 minutes. Mention this when returning `original_file` or `signed_file`.
- If the token is invalid or not found, ask the user to verify it or search with `list_documents`; do not fabricate a result.
- This workflow is read-only. Never call update, delete, create, or notification tools unless the user separately requests that action.
