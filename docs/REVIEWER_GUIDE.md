# ZapSign MCP Server — Reviewer Guide

This guide is for the **Anthropic MCP Review Team** evaluating the ZapSign connector for inclusion in the Connectors Directory.

## Product Overview

Create, send, and track e-signatures in Claude.

Bring ZapSign’s e-signature workflow into Claude. Create signing requests from a PDF URL or reusable template, add signers, deliver signing links by email or WhatsApp, and track document status—all in one conversation.

The server is built on Cloudflare Workers with OAuth 2.1 (DCR + PKCE S256), Streamable HTTP transport, and exposes 12 tools across 3 domains: documents, signers, and templates.

## Server URL

```
https://mcp.zapsign.co/mcp
```

## Test Credentials

No API token is stored in this guide. During OAuth, enter a ZapSign API Token for an account authorized for review. The token is entered only on the ZapSign authorization page; never add it to the connector URL or a URL query parameter.

## How to Connect

1. Open **Claude Settings > Connectors**
2. Click **Add Connector**
3. Enter the connector URL: `https://mcp.zapsign.co/mcp`
4. Claude starts OAuth and redirects you to the ZapSign authorization page
5. Enter your own API Token on that page
6. Approve the requested access and complete the connection
7. Claude should now have access to all 12 ZapSign tools

## Suggested Test Walkthrough

### Step 1: List existing documents

> **Prompt**: "List my ZapSign documents"

**Expected behavior**: Claude uses `list_documents` and returns a paginated list of documents with their names, statuses, and creation dates.

### Step 2: Get document details

> **Prompt**: "Show me the details of the first document"

**Expected behavior**: Claude uses `get_document` with the token from Step 1. Returns full document details including all signers, their signing status, and file URLs.

### Step 3: List templates

> **Prompt**: "What document templates do I have available?"

**Expected behavior**: Claude uses `list_templates` and returns available templates with their names and field configurations.

### Step 4: Create a document

> **Prompt**: "Create a test document called 'MCP Review Test' from this PDF: https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf — add a signer named 'Test Reviewer' with email test@example.com"

**Expected behavior**: Claude uses `create_document` with the PDF URL and signer details. Returns the new document token and a signing link for the signer.

### Step 5: Add another signer

> **Prompt**: "Add another signer named 'Second Reviewer' with email second@example.com to that document"

**Expected behavior**: Claude uses `add_signer` with the document token from Step 4. Returns the new signer's token and signing link.

### Step 6: Get signer details

> **Prompt**: "Show me the details of the first signer on that document"

**Expected behavior**: Claude uses `get_signer` and returns signer details including status (should be "new"), authentication mode, and view count.

### Step 7: Create from template (if templates exist)

> **Prompt**: "Create a document from my first template for signer 'Template Test User'"

**Expected behavior**: Claude uses `get_template` to discover fields, then `create_from_template` with the template token, signer name, and field values. Returns the new document with signing links.

### Step 8: Clean up

> **Prompt**: "Delete the test document we created"

**Expected behavior**: Claude uses `delete_document` with the document token from Step 4. Confirms the destructive operation completed.

## All 12 Tools

| Domain | Tool | Read-Only | Destructive |
|--------|------|-----------|-------------|
| Documents | `list_documents` | Yes | No |
| Documents | `get_document` | Yes | No |
| Documents | `create_document` | No | No |
| Documents | `update_document` | No | No |
| Documents | `delete_document` | No | Yes |
| Signers | `add_signer` | No | No |
| Signers | `get_signer` | Yes | No |
| Signers | `update_signer` | No | No |
| Signers | `delete_signer` | No | Yes |
| Templates | `list_templates` | Yes | No |
| Templates | `get_template` | Yes | No |
| Templates | `create_from_template` | No | No |

## Known Limitations

- **File URL expiration**: Document file URLs (`original_file`, `signed_file`) returned by `get_document` expire after approximately 60 minutes.
- **Rate limits**: ZapSign enforces 500 requests/minute per IP or token. The client retries once on 429 responses.
- **Response size**: Tool results are capped at 25,000 tokens. Paginated responses fit within this limit.

## Security

- OAuth 2.1 with DCR and PKCE (S256 only, plain PKCE rejected)
- API tokens encrypted at rest in Cloudflare KV
- CSRF protection on authorization page (KV-backed, 5min TTL, one-time use)
- HMAC-SHA256 integrity verification on OAuth request info
- Security headers: CSP (script-src 'none'), X-Frame-Options DENY, X-Content-Type-Options nosniff
- No passwords collected — the user's API token is entered on the ZapSign authorization page

## Related Documentation

- [README](../README.md) — Product description, setup, and conversation examples
- [Privacy Policy](PRIVACY_POLICY.md) — Data collection, storage, and user rights
- [Contributing Guide](CONTRIBUTING.md) — Development setup and coding standards

## Support

For questions during review: **support@zapsign.com.br**
