# ZapSign ID OAuth MCP Bridge Runbook

Operational guide for the ZapSign ID OAuth client bridge served at `/mcp/id` on the ZapSign MCP Worker. The signature MCP at `/mcp` is unchanged.

## Repo boundary

| Surface | Path | Auth model |
| --- | --- | --- |
| Signature MCP | `/mcp` | API token via `/authorize` |
| ZapSign ID MCP bridge | `/mcp/id` | OAuth client to `id.zapsign.com.br` |

## Published OAuth contract

| Item | Value |
| --- | --- |
| Issuer | `https://id.zapsign.com.br` |
| Authorization | `https://id.zapsign.com.br/oauth/authorize` |
| Token | `https://id.zapsign.com.br/oauth/token` |
| Revoke | `https://id.zapsign.com.br/oauth/revoke` |
| JWKS | `https://id.zapsign.com.br/oauth/jwks` |
| Discovery | `https://id.zapsign.com.br/.well-known/oauth-authorization-server` |
| Protected resource discovery | `https://api.id.zapsign.com.br/.well-known/oauth-protected-resource/v1` |
| API base (`aud`) | `https://api.id.zapsign.com.br/v1` |
| MCP client id | `zapsign-id-mcp` (public, no secret) |
| Redirect URI (exact) | `https://mcp.zapsign.com.br/mcp/id` |
| Scopes | `validations:read`, `validations:write` |
| PKCE | S256 only |
| Auth code TTL | 60 s |
| Access token TTL | 900 s |
| Refresh token TTL | 30 days, rotated on every refresh |

### Contract nuances

- Omitting `scope` at authorize time grants both validations scopes on the Id server.
- OAuth state/consent window: 600 s (bridge stores state ≤ 600 s).
- Reusing a rotated refresh token revokes the entire grant family (`invalid_grant`).
- `/v1` accepts `sk_*` API keys or OAuth JWT bearer tokens; `/api-keys*` rejects OAuth tokens.
- No dynamic client registration on Id — `zapsign-id-mcp` is statically allowlisted on Id production.

## Id-side production gate (required before E2E)

Discovery URLs must return JSON before live OAuth smoke tests:

```bash
curl -sS https://id.zapsign.com.br/.well-known/oauth-authorization-server
curl -sS https://api.id.zapsign.com.br/.well-known/oauth-protected-resource/v1
```

Id production must set:

- `OAUTH_SIGNING_KEY_CURRENT` — EC P-256 JWK JSON (`kid` e.g. `key-1787766561494`)
- `OAUTH_CONSENT_SIGNING_SECRET` — 64-char hex
- `OAUTH_MCP_CLIENT_ID=zapsign-id-mcp` (optional in AWS; app defaults apply)
- `OAUTH_MCP_REDIRECT_URI=https://mcp.zapsign.com.br/mcp/id` (optional in AWS; app defaults apply)

### AWS Secrets Manager (Id Replit env sync)

| Item | Value |
| --- | --- |
| Secret name | `/app/replit/envvars` |
| ARN | `arn:aws:secretsmanager:us-east-1:294606325700:secret:/app/replit/envvars-YCrRNa` |
| Profile | `zapsign-prd-cao58` |
| Keys set (2026-08-26) | `OAUTH_SIGNING_KEY_CURRENT`, `OAUTH_CONSENT_SIGNING_SECRET` |

Also mirror both keys in Replit **Tools → Secrets** (app-level). Republish Id ZapSign after secrets are present in both places.

## Bridge deployment (this repo)

1. Set encryption secret (32-byte key, base64):

```bash
npx wrangler secret put ID_TOKEN_ENCRYPTION_KEY
```

2. Deploy Worker:

```bash
npm run deploy
```

3. Verify ID MCP OAuth metadata responds on canonical host:

```bash
curl -sS https://mcp.zapsign.com.br/.well-known/oauth-protected-resource/mcp/id
curl -sS https://mcp.zapsign.com.br/id/authorize
```

4. Run unit acceptance suite locally (mocked fetch/KV):

```bash
npm test -- test/unit/id
```

## Bridge architecture

- Top-level dispatch in `src/index.ts` routes `/mcp/id` before signature `/mcp`.
- Second `OAuthProvider` (`src/id/bridge.ts`) exposes `/id/authorize`, `/id/token`, `/id/register`.
- ZapSign ID tokens encrypted in `OAUTH_KV` with prefix `id-tokens:` using `ID_TOKEN_ENCRYPTION_KEY`.
- OAuth state stored under `id-oauth-state:` (single-use consume).
- Refresh mutex under `id-refresh-lock:` prevents parallel rotation storms.
- MCP tool surface (7 validation tools; `/api-keys*` excluded — OAuth tokens rejected by Id API):

| MCP tool | OpenAPI operation | Scope |
| --- | --- | --- |
| `list_validations` | `GET /validations` | `validations:read` |
| `get_validation` | `GET /validations/{id}` | `validations:read` |
| `create_cpf_phone_match_validation` | `POST /validations/cpf-phone-match` | `validations:write` |
| `create_sim_swap_validation` | `POST /validations/sim-swap` | `validations:write` |
| `create_liveness_document_match_validation` | `POST /validations/liveness-document-match` | `validations:write` |
| `create_phone_ownership_validation` | `POST /validations/phone-ownership` | `validations:write` |
| `verify_validation` | `POST /validations/{id}/verify` | `validations:write` |

Skipped (OAuth bearer not accepted on Id API):

| OpenAPI operation | Rationale |
| --- | --- |
| `POST /api-keys` | `/api-keys*` requires `sk_*` API key; OAuth JWT rejected (403) |
| `GET /api-keys` | Same |
| `DELETE /api-keys/{id}` | Same |

Internal: disconnect via `/id/disconnect` (not an MCP tool).

## Smoke curls (after discovery is live)

Discovery + JWKS:

```bash
curl -sS https://id.zapsign.com.br/.well-known/oauth-authorization-server | jq .
curl -sS https://id.zapsign.com.br/oauth/jwks | jq .
```

Negative cases:

```bash
# Missing state
curl -sS -o /dev/null -w "%{http_code}\n" "https://mcp.zapsign.com.br/mcp/id?code=fake"

# Reused state should fail at callback
```

Full browser flow (manual):

1. Add MCP connector URL `https://mcp.zapsign.com.br/mcp/id` in Claude/ChatGPT.
2. Complete `/id/authorize` → Id login → callback `/mcp/id?code&state`.
3. Invoke `list_validations` with `{ "limit": 1 }`.

## Rollback

- Signature MCP and API keys (`sk_*`) are unaffected.
- Revoke grants on Id (`POST /oauth/revoke`) or delete `id-tokens:{userId}` keys in `OAUTH_KV` to cut OAuth access.
- Redeploy previous Worker version if bridge routing must be disabled quickly.

## Acceptance checklist mapping

| Scenario | Unit test file |
| --- | --- |
| Happy path callback | `test/unit/id/oauth-callback.test.ts` |
| Consent denial | `test/unit/id/oauth-callback.test.ts` |
| Tampering / reused state | `test/unit/id/oauth-callback.test.ts`, `oauth-state.test.ts` |
| Expired access refresh | `test/unit/id/token-service.test.ts` |
| Revoked grant | `test/unit/id/token-service.test.ts` |
| Insufficient scope | `test/unit/id/api-client.test.ts` |
| User isolation | `test/unit/id/token-service.test.ts` |
| Logging redaction | `test/unit/id/logging.test.ts` |
| `/mcp` unchanged | `test/unit/id/bridge-dispatch.test.ts` |

## Known blocker

As of 2026-08-26, Id signing secrets are configured in AWS Secrets Manager and Replit app secrets, but **republish still fails** on deploy healthchecks (OAuth routes return **500** during probes; Replit reports port 8080 not detected). Discovery/JWKS remain **404** on the live host until a successful republish. Build and unit-test against the fixed contract now; gate E2E OAuth on discovery returning JSON.
