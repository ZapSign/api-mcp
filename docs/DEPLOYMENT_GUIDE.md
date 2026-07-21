# Safe Deployment and Publication Guide

This guide records the deployment prerequisites and the safe checks for the
ZapSign MCP Worker. It does not authorize a production deployment, a DNS or
dashboard change, a secret write, a KV mutation, or a POST request to a
production endpoint.

## Audit snapshot

The following read-only checks were run on 2026-07-14:

```bash
npx wrangler deploy --dry-run --outdir=/tmp/zapsign-wrangler-dry-run
curl --location --request GET https://mcp.zapsign.co/health
curl --location --request GET https://mcp.zapsign.co/.well-known/oauth-authorization-server
curl --location --request GET https://mcp.zapsign.com.br/health
curl --location --request GET https://mcp.zapsign.com.br/.well-known/oauth-authorization-server
```

Observed state:

- Both custom-domain health endpoints returned `200` without a redirect.
- Each custom domain advertised a self-consistent OAuth issuer and endpoint
  origin. Use one canonical domain in public listings; do not exchange an
  OAuth flow across the two origins.
- The dry run resolved `OAUTH_KV`, `ZAPSIGN_API_URL`, and `ENVIRONMENT` from
  `wrangler.jsonc` and produced no deployment.
- No POST request was sent to production.

This live state does not make the repository configuration reproducible. The
dashboard may contain route state that is not represented in the worktree.

## Wrangler configuration and publication blocker

`wrangler.jsonc` currently declares the account, the `OAUTH_KV` binding, public
variables, compatibility settings, and observability. It does not declare:

- an explicit Worker `name`;
- `workers_dev: false`;
- either custom domain as a `custom_domain` route; or
- a canonical-domain policy for the second live hostname.

This is a deployment blocker, not a reason to guess at a configuration change.
The account owner must first confirm the target account, Worker name, KV
namespace, and the exact set of domains that should remain attached. Only then
should the declarative configuration be reviewed for a change similar to the
following shape:

```jsonc
{
  "name": "<confirmed-worker-name>",
  "account_id": "<confirmed-account-id>",
  "workers_dev": false,
  "routes": [{ "pattern": "<confirmed-canonical-domain>", "custom_domain": true }],
}
```

Do not copy this example into production without confirmation. Adding
`workers_dev: false` or changing routes can remove an existing access path on
the next deployment. If both custom domains are intentionally supported, each
must be declared and tested as its own OAuth origin; a redirect from one origin
to the other is not an OAuth-safe alias.

The KV namespace ID is infrastructure state and must be supplied by the
account owner. `COOKIE_ENCRYPTION_KEY` must remain a Wrangler secret and must
never be placed in `wrangler.jsonc`, CI logs, or a command transcript.

## Domain, workers.dev alias, and redirect controls

The desired publication state is:

1. The canonical custom domain reaches the Worker directly over HTTPS.
2. OAuth discovery, authorization, token, registration, and protected-resource
   metadata all use that same origin.
3. No Page Rule, Redirect Rule, Bulk Redirect, DNS redirect, or application
   redirect rewrites OAuth requests between origins.
4. The default `workers.dev` hostname is disabled after the custom-domain
   route is reproducibly declared and verified, unless the owner explicitly
   needs it as a separately documented operational endpoint.

The current worktree cannot prove the actual workers.dev hostname or whether
it is enabled. The account owner must inspect Workers **Settings > Domains &
Routes**, DNS records, Page Rules, Redirect Rules, and Bulk Redirects. Record
the result without changing it during the audit. A `301` or `302` from any
OAuth endpoint is a publication blocker.

Safe verification commands, after the owner supplies the confirmed hostname,
are GET-only:

```bash
curl --silent --show-error --location --request GET \
  "https://<confirmed-hostname>/health"
curl --silent --show-error --location --request GET \
  "https://<confirmed-hostname>/.well-known/oauth-authorization-server"
```

Do not use `--data`, `-X POST`, `/register`, `/authorize/login`, or `/token` in
an unauthorised production check.

## Recommended edge rate limiting

Rate limiting is not declared in this repository and should be implemented as
Cloudflare WAF/Rate Limiting rules at the edge, with an explicit exception
process for trusted test clients. These are starting values for a staging
calibration, not changes performed by this task:

| Path               | Method |                                                        Starting limit | Key and rationale                                                                                                                                                                 |
| ------------------ | -----: | --------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/register`        | `POST` |                                        10 requests/minute/IP, burst 5 | Public DCR writes `client:*` KV records. Alert and return `429`; never log the body or returned client secret.                                                                    |
| `/authorize`       |  `GET` |                                       30 requests/minute/IP, burst 10 | The page creates a short-lived CSRF KV entry. Keep enough burst for browser retries.                                                                                              |
| `/authorize/login` | `POST` |                  5 requests/minute/IP, burst 2, plus a 20/hour/IP cap | This endpoint accepts the ZapSign API token and calls the upstream API. Do not use the token, body, or query values as a rate-limit key.                                          |
| `/token`           | `POST` | 30 requests/minute/IP, burst 10, plus a client-aware failed-auth rule | This is the provider's token and refresh endpoint. Key on IP and, where the edge product supports it, the registered `client_id`; never record codes, secrets, or request bodies. |

The rules should be scoped to the canonical hostname and reviewed for IPv6,
NAT, and legitimate Claude traffic. Responses should be `429` with a bounded
`Retry-After`; rate limiting must not be implemented by deleting or expiring
OAuth KV data. Validate the limits in a non-production environment before
publishing them.

## Logging and observability review

The application logger writes structured event names, HTTP methods, status
codes, error classes, page numbers, and short correlation IDs. Current call
sites do not pass API tokens, OAuth codes, client secrets, request bodies, or
upstream response bodies to the logger. The logger also filters metadata keys
matching `token`, `authorization`, `password`, `secret`, `name`, `email`,
`phone`, and `body`.

`observability.logs.enabled` and invocation logs are enabled in Wrangler. That
is useful operationally, but the repository cannot verify Cloudflare's
retention, access policy, or platform-level request metadata without dashboard
access. Before publication, the account owner must confirm that invocation
logs and any exports do not retain URL query strings containing OAuth codes,
request bodies, `Authorization` headers, client secrets, or ZapSign tokens.
Keep access to logs least-privilege and set a documented retention period.

Do not add debug logging around `request.text()`, `Authorization`, OAuth
redirect URLs, or upstream response bodies. Correlation IDs are safe to share
with an incident report; credentials and bearer values are not.

## Dependency audit and upgrade triage

`npm audit` on the current lockfile reported 21 vulnerabilities across the
full tree: 1 critical, 12 high, 7 moderate, and 1 low. `npm audit --omit=dev`
reported 10 runtime-tree vulnerabilities: 5 high and 5 moderate, with no
critical finding.

Urgent triage:

- `vitest@3.2.4` has a critical development-server/UI issue. Do not expose a
  Vitest UI or development server to a network. Upgrade to a patched Vitest
  release (the audit identified `>=3.2.6`) before enabling such a server.
- The runtime tree includes high findings through transitive `fast-uri`,
  `hono`, `lodash`, `path-to-regexp`, and `picomatch`. Identify the patched
  transitive versions and run the full Worker test suite before publication;
  do not assume a production build is clean because the direct package list
  is small.

Major or coordinated upgrades:

- The audit's automatic fix for
  `@cloudflare/vitest-pool-workers@0.12.20` points to `0.18.4`, a major
  upgrade, and also affects the `miniflare`, `undici`, `ws`, and development
  `wrangler` dependency graph.
- Do not run `npm audit fix --force` as part of deployment preparation. Create
  a separate dependency change, review its lockfile diff, and run typecheck,
  lint, unit tests, integration sandbox tests, and a Wrangler dry run.
- The audit is a dependency signal, not a deployment authorization. No
  dependency or lockfile change was made in this security/operations pass.

## Safe audit of orphaned DCR clients

The OAuth provider stores DCR records under `client:<client_id>` in
`OAUTH_KV`. The provider exposes `listClients({ limit, cursor })` through its
OAuth helper API. Use an authenticated, owner-controlled maintenance path or
an offline export with a scoped Cloudflare token; do not add a public admin
route merely to perform this review.

1. Confirm the account ID, Worker, KV namespace, and audit timestamp.
2. List client metadata with pagination. Record only a salted local reference
   or the client ID, registration timestamp, redirect URI hosts, client name,
   and token endpoint auth method. Do not export `clientSecret` hashes,
   contacts, or full metadata unless there is an approved incident need.
3. Compare each client with the current approved integration inventory and
   redirect URI allowlist. Treat unknown clients, stale redirect hosts, and
   registrations with no accountable owner as candidates, not as confirmed
   orphans.
4. Correlate candidates with grant summaries (`clientId`, `userId`, created
   time, and expiry) using the provider's read-only listing helpers. Preserve
   the minimum data needed for the review and do not log user IDs or token
   material.
5. Obtain written owner approval for each remediation. Prefer disabling or
   revoking through the provider's supported administrative workflow, with a
   recorded rollback decision. Never delete `client:*`, `grant:*`, or
   `token:*` keys directly during discovery.
6. Re-run the read-only inventory and retain a before/after count without
   retaining credentials. If a client secret may have been exposed, rotate or
   revoke it through the approved owner workflow; do not attempt to recover it
   from KV.

This task performed no DCR listing against production and did not delete or
modify any KV key.

## Deployment gate and unresolved blockers

Before an owner performs a deployment or publication, all of the following
must be checked:

- [ ] Confirm the target Cloudflare account and KV namespace with the owner.
- [ ] Declare the Worker name, custom domain route(s), and `workers_dev`
      policy in a reviewed Wrangler change.
- [ ] Confirm one canonical public OAuth origin and test every metadata
      endpoint on that origin without redirects.
- [ ] Inspect and document DNS, Page Rules, Redirect Rules, Bulk Redirects,
      and workers.dev settings.
- [ ] Configure and calibrate edge rate limits for the four OAuth paths.
- [ ] Verify log retention and access do not expose tokens, secrets, codes, or
      bodies.
- [ ] Resolve or explicitly accept the runtime high vulnerabilities with a
      security owner; complete the separate major dev-tool upgrade plan.
- [ ] Run the repository checks and a Wrangler dry run from the reviewed
      commit.
- [ ] Set `COOKIE_ENCRYPTION_KEY` through the secret manager only, never in
      JSON, Git, or CI output.
- [ ] Complete the read-only DCR client inventory and document any approved
      remediation separately.

Until the route declaration, workers.dev policy, edge controls, dashboard
logging review, and dependency triage are owner-approved, deployment/public
listing remains blocked. This guide intentionally leaves production,
Cloudflare KV, secrets, DNS, and dashboard state unchanged.
