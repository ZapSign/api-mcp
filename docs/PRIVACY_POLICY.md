# Privacy Policy — ZapSign MCP Connector

**Canonical URL:** https://mcp.zapsign.com.br/privacy  
**Last updated:** August 28, 2026

This document describes how the ZapSign MCP Connector ("the Connector") collects, stores, and processes data when used through Claude AI (Anthropic) or ChatGPT (OpenAI) via the Model Context Protocol (MCP).

## Data Collected

The Connector collects a single credential during the authorization flow:

- **ZapSign API Token**: Provided by the user during the OAuth authorization wizard. The user copies this token from their [ZapSign Dashboard > Integrations](https://app.zapsign.com.br/conta/integracoes) page and pastes it into the Connector's authorization form.

The MCP request and response pass-through may contain **document names and statuses** and **signer names and contact details** because they are required to create and track signing workflows. These values are forwarded to the user's ZapSign account and the MCP host only for the requested operation; they are not persisted by this Connector. A SHA-256 hash prefix of the API token is used as an anonymous session identifier — the original token cannot be derived from this hash.

The Connector does **not** request or return CPF, CNPJ, payment-card data, health data, or biometric data. It also removes internal IDs, external IDs, raw metadata, processor IDs, and other unnecessary identifiers from ZapSign responses before returning them to the MCP host.

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

The Connector operates as a pass-through proxy: it forwards requests from the MCP client (Claude, ChatGPT, or another compatible client) to ZapSign's API and returns the responses. No ZapSign business data is persisted on the Connector's infrastructure.

## Data Retention

- **OAuth grants** expire after **30 days** (aligned to the MCP refresh token TTL of 2,592,000 seconds). After expiration, the user must reconnect the Connector through their MCP client settings.
- **KV entries** are automatically cleaned up by Cloudflare upon expiration. No manual purging is required.
- **CSRF tokens** expire after 5 minutes and are deleted on first use.

## Third-Party Data Sharing

- **ZapSign (zapsign.com.br)**: API calls are made to ZapSign on the user's behalf using their API token. This is the sole purpose of the Connector.
- **Cloudflare**: The Connector runs on Cloudflare Workers. Cloudflare processes requests and stores encrypted KV data as the infrastructure provider.
- **Anthropic (Claude) / OpenAI (ChatGPT)**: The MCP host receives tool results returned by the Connector. How those hosts process conversations is governed by their own privacy policies.
- **No other third parties**: No data is sold to or made available to any other third party for marketing purposes.

Optional marketing analytics (Google Analytics 4 and Microsoft Clarity) may run on public documentation pages (`/docs`, browser landing for `/mcp`, and `/privacy`) only after the user consents via the on-page banner. Authorization pages (`/authorize`) are never instrumented.

## Data Location

All data is processed on [Cloudflare's global edge network](https://www.cloudflare.com/network/). KV storage is distributed globally across Cloudflare's data centers. Requests are processed at the edge location nearest to the user.

## User Rights

- **Disconnect at any time**: Users can remove the Connector via **Claude Settings > Connectors**, **ChatGPT Apps & Connectors**, or their MCP client's equivalent disconnect flow. Disconnecting revokes the OAuth grant and removes all stored tokens from Cloudflare's systems.
- **Token rotation**: Users can invalidate the Connector's access by regenerating their API token in the ZapSign Dashboard. The Connector will stop functioning until the user reconnects with a new token.
- **Transparency**: The authorization page clearly displays what permissions the Connector requests before the user provides their token.

## Contact

For privacy inquiries or questions about data handling, contact:

**support@zapsign.com.br**
