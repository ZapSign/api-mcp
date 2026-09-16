/**
 * Runtime copy of docs/PRIVACY_POLICY.md (Workers cannot read the repo filesystem).
 * Keep this string in sync when editing the markdown source.
 */
export const PRIVACY_POLICY_MARKDOWN = `# Privacy Policy — ZapSign MCP Connector

**Canonical URL:** https://mcp.zapsign.com.br/privacy  
**Last updated:** September 16, 2026

This document describes how the ZapSign MCP Connector ("the Connector") collects, stores, and processes data when used through Claude AI (Anthropic) or ChatGPT (OpenAI) via the Model Context Protocol (MCP).

This page is the privacy policy linked from the OpenAI Apps / ChatGPT listing (\`https://mcp.zapsign.com.br/privacy\`).

## Data Collected

The Connector collects a single credential during the authorization flow:

- **ZapSign API Token**: Provided by the user during the OAuth authorization wizard. The user copies this token from their [ZapSign Dashboard > Integrations](https://app.zapsign.com.br/conta/integracoes) page and pastes it into the Connector's authorization form.

A SHA-256 hash prefix of the API token is used as an anonymous session identifier — the original token cannot be derived from this hash.

## MCP response field disclosure (ChatGPT / Claude)

Tool results returned to the MCP host are filtered with a **response allowlist**. Only the fields below are eligible to reach ChatGPT or Claude. Everything else from the upstream ZapSign API is dropped before the MCP \`tools/call\` result is returned.

### Data returned / Purpose / Source

| Data returned | Purpose | Source |
|---|---|---|
| Document \`token\`, \`name\`/\`title\`, \`status\`, \`created_at\` (or \`created_date\`), \`signed_count\` / signing progress | Create and track e-signature workflows | ZapSign document API (allowlisted fields only) |
| Nested signer \`token\`, \`name\`, \`status\`, \`status_code\`, \`signed_at\`, \`qualification\`, \`auth_mode\` | Show who must sign and current status | ZapSign signer objects on documents (allowlisted) |
| Signer \`email\` (owner-gated) | Identify participants when the caller owns the document | ZapSign signer API (only when ownership is verified) |
| Template \`token\`, \`name\`, active flag, input **names**/variable keys | Select templates and request fill values | ZapSign template API (allowlisted; no secret payloads) |
| \`answers_count\` / \`answers_filled\` and \`metadata_count\` / \`metadata_filled\` (\`name\` + \`filled\` boolean only) | Know whether template/document fields were filled **without** reading values | Derived from ZapSign \`answers\`/\`metadata\` (values withheld) |
| \`sign_url\` / signing link | Deliver the signing link **at creation time** | Returned only from \`create_document\`, \`add_signer\`, or \`create_from_template\` responses |
| Webhook id / configuration echoed on create | Confirm webhook setup | ZapSign webhooks API (configuration needed to confirm) |
| ZapSign API token (OAuth wizard only) | Authenticate subsequent API calls on the user's behalf | User paste from ZapSign Dashboard → Integrations |

### We do not expose via MCP

The Connector does **not** return the following categories to ChatGPT, Claude, or any MCP host:

- CPF / CNPJ or other government identity numbers
- Biometric photos, selfie captures, or liveness images (\`selfie_photo_url\`, \`liveness_photo_url\`, related validation payloads)
- ID / document photos (\`document_photo_url\`, \`document_verse_photo_url\`, and equivalents)
- Precise geolocation (\`geo_latitude\`, \`geo_longitude\`)
- IP addresses
- Digital certificates, signature images, or visto images
- \`sign_url\` / \`signing_link\` on **read** tools (\`get_document\`, \`get_signer\`, \`list_documents\`, and similar)
- Raw \`answers\` or \`metadata\` **values** (fast path: counts and filled flags only)
- Phone numbers on read responses, internal/debug fields (\`uploaded_files\`, \`resend_attempts\`, \`sandbox\`, hashes, payment processor IDs, free-form payment notes)

Submission-facing allowlist detail for reviewers: OpenAI submission pack \`docs/submission/openai.md\` (Expected response contract for resubmission).

## Data Stored

- **API Token**: Encrypted and stored in [Cloudflare Workers KV](https://developers.cloudflare.com/kv/), bound to the user's OAuth session. The token is used exclusively to authenticate API requests to ZapSign on the user's behalf.
- **OAuth session metadata**: Standard OAuth 2.1 grant data (client ID, granted scopes, token expiry) managed by Cloudflare's [OAuthProvider](https://github.com/cloudflare/workers-oauth-provider) library.
- **CSRF tokens**: Short-lived tokens (5-minute TTL) stored in KV during the authorization flow to prevent cross-site request forgery. Automatically deleted after single use or expiration.

## Data NOT Stored

The Connector does **not** store, cache, or log:

- Documents, PDFs, or document content
- Signer contact details and document participant data
- Template content or field values
- Webhook payloads or event data
- API request or response bodies
- Chat messages from Claude or ChatGPT
- CPF, CNPJ, payment-card data, health data, or biometric data

The Connector operates as a pass-through proxy with response minimization: it forwards requests from the MCP client (Claude, ChatGPT, or another compatible client) to ZapSign's API and returns **allowlisted** responses only. No ZapSign business data is persisted on the Connector's infrastructure.

## Data Retention

- **OAuth grants** expire after **30 days** (aligned to the MCP refresh token TTL of 2,592,000 seconds). After expiration, the user must reconnect the Connector through their MCP client settings.
- **KV entries** are automatically cleaned up by Cloudflare upon expiration. No manual purging is required.
- **CSRF tokens** expire after 5 minutes and are deleted on first use.

## Third-Party Data Sharing

- **ZapSign (zapsign.com.br)**: API calls are made to ZapSign on the user's behalf using their API token. This is the sole purpose of the Connector.
- **Cloudflare**: The Connector runs on Cloudflare Workers. Cloudflare processes requests and stores encrypted KV data as the infrastructure provider.
- **Anthropic (Claude) / OpenAI (ChatGPT)**: The MCP host receives allowlisted tool results returned by the Connector. How those hosts process conversations is governed by their own privacy policies.
- **No other third parties**: No data is sold to or made available to any other third party for marketing purposes.

Optional marketing analytics (Google Analytics 4 and Microsoft Clarity) may run on public documentation pages (\`/docs\`, browser landing for \`/mcp\`, and \`/privacy\`) only after the user consents via the on-page banner. Authorization pages (\`/authorize\`) are never instrumented.

## Data Location

All data is processed on [Cloudflare's global edge network](https://www.cloudflare.com/network/). KV storage is distributed globally across Cloudflare's data centers. Requests are processed at the edge location nearest to the user.

## User Rights

- **Disconnect at any time**: Users can remove the Connector via **Claude Settings > Connectors**, **ChatGPT Apps & Connectors**, or their MCP client's equivalent disconnect flow. Disconnecting revokes the OAuth grant and removes all stored tokens from Cloudflare's systems.
- **Token rotation**: Users can invalidate the Connector's access by regenerating their API token in the ZapSign Dashboard. The Connector will stop functioning until the user reconnects with a new token.
- **Transparency**: The authorization page clearly displays what permissions the Connector requests before the user provides their token.

## Contact

For privacy inquiries or questions about data handling, contact:

**support@zapsign.com.br**
`;
