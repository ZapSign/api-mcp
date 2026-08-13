# Agent document metadata

**Status:** Active  
**Last updated:** 2026-08-13

## Purpose

Stamp every document created through the official ZapSign MCP (`mcp-server-zapsign` npm STDIO and remote OAuth) with the reserved ZapSign create metadata pair `origin=mcp`, so product analytics can count agent-created documents from webhooks.

## Inputs

Any successful create call from this MCP that maps to:

- `POST /api/v1/docs/` or `POST /api/v1/docs/async/` (`ZapSignClient.createDocument`)
- `POST /api/v1/models/create-doc/` or `POST /api/v1/models/create-doc/async/` (`ZapSignClient.createFromTemplate`)

Callers do not pass `metadata` through MCP tool schemas. Injection happens inside `ZapSignClient` only.

## Outputs

The JSON request body sent to ZapSign includes:

```json
"metadata": [{ "key": "origin", "value": "mcp" }]
```

The JSON key is lowercase `metadata` (same style as `external_id`). The reserved pair is identical for STDIO and OAuth. ZapSign surfaces this metadata on create/sign/refuse/delete webhooks; it is not stored on the GET document resource.

## Invariants

- The reserved pair `{ key: "origin", value: "mcp" }` is always present on in-scope create POST bodies.
- If caller-supplied metadata already contains `origin`, the reserved value `mcp` overwrites it.
- Non-reserved metadata keys are preserved.
- STDIO and OAuth use the same tag (no transport discriminator).
- Tool input schemas stay `.strict()` and do not expose `metadata`.
- The reserved pair is not PII.

## Error taxonomy

| Condition | Behavior |
|-----------|----------|
| ZapSign rejects `metadata` | Create fails as today (`ZapSignApiError` from the upstream response). The client does not drop or retry-around metadata. |
| Upstream timeout / 4xx / 5xx | Unchanged from existing `ZapSignClient` error mapping. |
| Missing auth / missing scope | Unchanged; tools never reach the inject point. |

No new error codes.

## Acceptance

WHEN `ZapSignClient.createDocument` POSTs a document (sync or async)  
THEN the JSON body includes `metadata` containing `{ "key": "origin", "value": "mcp" }`.

WHEN `ZapSignClient.createFromTemplate` POSTs a document (sync or async)  
THEN the JSON body includes `metadata` containing `{ "key": "origin", "value": "mcp" }`.

WHEN `createDocument` is called with existing metadata that includes other keys and/or `origin`  
THEN sent metadata keeps non-reserved keys and sets `origin` to `mcp`.

WHEN `withAgentDocumentMetadata` is called with no caller metadata  
THEN it returns `[{ "key": "origin", "value": "mcp" }]`.

## Out of scope

- `add_extra_document` / extra-doc uploads
- Transport discriminator (`stdio` vs OAuth)
- GET-document persistence (ZapSign does not store metadata on the document resource)
- GA4 / Clarity / marketing measurement IDs
- Warehouse, dashboard, or webhook-consumer implementation (data team follow-up: filter webhook `metadata`, not `created_through`, which stays `api`)
- npm publish and Worker production deploy unless separately requested
