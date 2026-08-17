# MCP Marketplace Dual Publication — Launch State

**Last updated:** 2026-08-14 17:52 -03 — OpenAI draft is complete: all **25 tools** were imported, all **75** per-tool annotation justifications persisted across reload, and `MCP is incomplete` cleared. Final submission remains unconfirmed because `cursor-ide-browser` is absent from the current MCP tool catalog, so the agent could not open the Submit page or click **Submit for Review**. No submission ID/status was produced. Atlassian/Jira MCP is also unavailable, so CAO-148 was not commented. Claude Team/Enterprise remains blocked; no Anthropic submission.

**Decision locked:** Submit truthful **25-tool** inventory first. Gate remote marketplace surface to core 12 only after **both** listings are Live (Phase 4).  
**Canonical server:** `https://mcp.zapsign.com.br/mcp`  
**Repo:** [ZapSign/api-mcp](https://github.com/ZapSign/api-mcp) · **npm:** `mcp-server-zapsign`  
**Epics/tasks:** [CAO-146](https://truora.atlassian.net/browse/CAO-146) · [CAO-147](https://truora.atlassian.net/browse/CAO-147) · [CAO-148](https://truora.atlassian.net/browse/CAO-148)

Do **not** put `mcp.zapsign.co` or legacy/`fabricio` URLs in submission forms. Worker may keep `.co` as a dual-host alias.

---

## Phase progress

| Phase | Status | Notes |
|---|---|---|
| 0 — Recon / compliance | **Complete** | Commits `b3b32a3`, `e5b044a`, `7ae7f61`; Worker deployed (Version `adeae044-b5bb-4980-a1fd-ccc0c74bf15a`); `/privacy` **200** |
| 1 — Demo account | **Cleared (session)** | AWS SM `stress-testing` key `token` validated 2026-08-13 via `GET /api/v1/docs/` **200** (session env only; never committed) |
| 2A — Anthropic submit | **Blocked** | Portal requires Claude **Team/Enterprise** org; current session is individual **Max** (Andre Chaves). Unchanged 2026-08-14. |
| 2B — OpenAI submit | **Form complete; browser MCP blocked** | Draft access, domain verification, OAuth/tool import, 25-tool inventory, and 75/75 annotation justifications are complete. Only the final **Submit for Review** click/confirmation remains; `cursor-ide-browser` is unavailable in the current session. |
| 3 — Follow-up until Live | Pending | No gate-to-12 during review |
| 4 — Close-out + gate to 12 | Pending | After both Live |

---

## Production endpoint evidence (2026-07-31 post-deploy)

| Check | Result | Evidence |
|---|---|---|
| `GET https://mcp.zapsign.com.br/health` | **200** | `{"status":"ok","version":"2.0.0",...}` |
| `GET https://mcp.zapsign.com.br/privacy` | **200** | HTML includes “Privacy Policy” + “ZapSign MCP” |
| `GET https://mcp.zapsign.com.br/docs` | **200** | Public docs page |
| `GET https://mcp.zapsign.com.br/mcp` | **401** | `invalid_token` / Missing or invalid access token (expected) |
| `GET https://mcp.zapsign.com.br/.well-known/oauth-authorization-server` | **200** | issuer `https://mcp.zapsign.com.br`; scopes include documents/signers/templates/webhooks/partner |
| Deploy | **OK** | `npm run deploy` → `zapsign-mcp`; Version ID `adeae044-b5bb-4980-a1fd-ccc0c74bf15a`; custom domains `mcp.zapsign.com.br`, `mcp.zapsign.co` |
| Registry tool count | **25** | `src/tools/registry.ts` |
| OpenAI challenge route | **Live / verified** | `GET /.well-known/openai-apps-challenge` returns the portal token; Worker Version `6e7c93d2-02f6-4b50-9559-bcf5b9939374`; OpenAI shows `Domain verified` |

**Phase 0 commits (local main):**

| SHA | Summary |
|---|---|
| `b3b32a3` | `feat(privacy): serve GET /privacy for directory submissions` |
| `e5b044a` | `docs(submission): freeze 25-tool marketplace packs and launch state` |
| `7ae7f61` | `chore(marketing): record day-0 marketplace metrics baseline` |
| `a9e4128` | `docs(launch): record privacy deploy evidence and Phase 1 HARD GATE` |
| `5f8b930` | `feat(openai): serve Apps domain challenge well-known route` |

---

## ANTHROPIC track (CAO-147)

Mirrors Jira checklist. Update checkboxes as work completes.

### A. Pre-submission

- [x] Align artifacts to `mcp.zapsign.com.br` (README, REVIEWER_GUIDE, SUBMISSION_PLAN §3, submission packs)
- [x] Inventory locked to **25 tools** (not 12) for first submit
- [x] Privacy route implemented (`GET /privacy`); unit tests green
- [x] Privacy **live** at `https://mcp.zapsign.com.br/privacy` (deploy Version `adeae044…`)
- [x] Support = support@zapsign.com.br; SECURITY.md present (supported versions → 2.x)
- [x] Public docs page `/docs`; OAuth metadata verified
- [x] Allowed link URIs documented (ZapSign-owned only)
- [ ] MCP Inspector against production confirms 25 tools with `title` + four hints

### B. Reviewer test account

- [x] Demo API token available in agent session (AWS SM `stress-testing` → `token`; validated 2026-08-13)
- [ ] Demo data loaded (3+ docs, 1 template, 2–3 signers) — company already has docs; freeze identifiers TBD
- [x] Token validated via `GET /api/v1/docs/`
- [ ] REVIEWER_GUIDE walkthrough E2E
- [ ] Freeze credentials until both reviews conclude

### C. Submission

- [ ] Fill form from `docs/submission/anthropic.md`
- [ ] Screenshot confirmation → attach here + CAO-147 comment
- [ ] Record submission date

**BLOCKER (2026-08-13; still active 2026-08-14):** Remote submissions use in-app portal `https://claude.ai/admin-settings/directory/submissions/new`. Requires Claude **Team or Enterprise** org + Directory management access. Authenticated session is individual **Max** (Andre Chaves) → “organization settings available on Team and Enterprise only.” Jira comment `134920`. Last continue attempt (prior agent) disconnected before docs/Jira updates; **no directory submission attempted**; no submission ID.

**Submission date:** _pending_  
**Live date:** _pending_

### D. Follow-up until Live

- [ ] Monitor support@zapsign.com.br; respond &lt; 48h
- [ ] Weekly status; escalate mcp-review@anthropic.com after 3 weeks silence
- [ ] On approval: listing screenshot + fresh install + OAuth + `list_documents`
- [ ] E1 day-0 baseline logged

---

## OPENAI track (CAO-148)

Merged from `docs/submission/openai-org-status.md`.

### A. Org registration & verification

- [x] ZapSign OpenAI org + Apps Management write (Owner: André Chaves; org `org-zytAEIEHDhfBrgREh8gTiYUA`)
- [x] Individual developer identity verification (Persona — `ANDRE DE MORAES CHAVES`)
- [x] Customer support URL populated (`https://zapsign.com.br/contato/`)
- [x] Domain verification for `mcp.zapsign.com.br` (Worker challenge live; OpenAI shows `Domain verified`)

**OAuth token exchange failure (resolved 2026-08-14):** Persona and domain verification are complete. Listing fields were populated earlier. The prior flow completed ZapSign authorize but failed OpenAI token exchange with `401 invalid_client`.

**Root cause (confirmed in code + live metadata):** ChatGPT/OpenAI uses CIMD (`client_id` like `https://chatgpt.com/oauth/.../client.json`) because production AS advertises `client_id_metadata_document_supported: true`. That document sets `token_endpoint_auth_method: "private_key_jwt"` and also lists `token_endpoint_auth_methods_supported: ["none","private_key_jwt"]`. Production Worker pins `@cloudflare/workers-oauth-provider@0.2.4`, which accepts CIMD `private_key_jwt` but only implements client auth as `none` **or** `client_secret_*` at `/token`. Result: authorize/`lookupClient` succeeds; `/token` returns `401 invalid_client` (`missing client_secret` / auth mismatch). Library **0.10.x** negotiates CIMD auth down to `none` when the client also offers `none` (ChatGPT does).

**Not missing:** user token paste, redirect_uri pattern, PKCE S256, DCR KV persistence for this path (CIMD does not store a DCR client), or `client_secret` from OpenAI.

**Fix deployed and scan succeeded:** bumped `@cloudflare/workers-oauth-provider` to `^0.10.3` (resolved 0.10.3), set `clientIdMetadataDocumentEnabled: true` on `OAuthProvider`, and preserved `global_fetch_strictly_public`. Typecheck, lint, focused OAuth configuration test, and all 359 tests pass. Worker `0685d70d-6b6f-433d-8f2b-d27d2bc082a5` is live; health returns 200 and production metadata advertises CIMD plus token endpoint auth methods `client_secret_basic`, `client_secret_post`, and `none`. OpenAI imported **25 tools**, and all **75** annotation justifications were verified and persisted. Final submission is blocked only by unavailable browser automation in the current agent session. **No submission yet.**

### B. Technical compliance

- [x] Public MCP URL documented; OAuth AS metadata OK
- [x] 25 tools with human titles + annotations in registry
- [x] CSP profiles documented in `docs/submission/openai.md`
- [x] Worker `GET /.well-known/openai-apps-challenge` implemented (secret-driven)
- [ ] Stability/latency pass with demo account

### C. Listing assets & test materials

- [x] Frozen copy in `docs/submission/openai.md` (starter prompts, 5+/3− cases, countries)
- [x] Demo token session-validated (shared with Anthropic track)

### D. Submission & follow-up

- [x] OAuth completed and OpenAI tools imported (agent-verified 2026-08-14: **25 tools**, 75 justification fields rendered)
- [x] Per-tool annotation justifications filled (75/75: read-only, open-world, destructive × 25) — text frozen in `docs/submission/openai-tool-annotations.md`, re-runnable via `scripts/submission/openai-fill-tool-justifications.js`
- [ ] Submit via platform portal
- [ ] Screenshot + CAO-148 comment
- [ ] Follow-up until Live; E2 day-0 baseline

**Submission date:** _pending_  
**Live date:** _pending_

---

## Metrics baseline (day 0 — marketplace launch prep)

See `docs/marketing/STATUS.md` (2026-07-31 entry) and `docs/marketing/snapshots/`.

| Source | What | Where it will come from |
|---|---|---|
| npm weekly downloads | `mcp-server-zapsign` (+ optional community benchmark) | `scripts/marketing/take-snapshot.mjs` → npm registry API |
| DCR / OAuth funnel | Client registrations, token issuance | Cloudflare Worker logs / analytics (instrument before Live day-0) |
| Docs / privacy traffic | `/docs`, `/privacy`, `/mcp` landing | GA4 `G-GNJFSQFD50` + Clarity (consent-gated marketing pages) |
| Directory installs | E1/E2 | Anthropic/OpenAI dashboards + Worker DCR after Live |

---

## Hard gates (human)

| Gate | Ticket | Ask | Status |
|---|---|---|---|
| Demo/reviewer ZapSign API token (session) | CAO-147 (+148) | AWS SM `stress-testing` / session env | **Cleared (session)** 2026-08-13 |
| Deploy `/privacy` | CAO-147 | `wrangler deploy` with Cloudflare account access | **Cleared** — privacy 200 |
| OpenAI 2FA / org login | CAO-148 | Authenticated ZapSign Platform session | **Cleared** |
| Persona Individual ID check (camera) | CAO-148 | Complete Persona inquiry `inq_Ab5jmhWpKCzNqhgewMpETYB511QJLU` | **Cleared** — identity verified |
| OpenAI MCP OAuth token exchange | CAO-148 | Retry Platform OAuth/Scan Tools against Worker `0685d70d…` | **CLEARED** — tools imported after OAuth fix |
| OpenAI MCP tool scan / submit | CAO-148 | Verify 25 imported tools, complete required fields, then Submit for Review | **CLEARED for access** — draft reopened after switching default org to ZapSign; 25 tools and 75 justifications verified. Submit click not yet confirmed (agent browser MCP unstable) |
| OpenAI Business verification (optional after Individual) | CAO-148 | CNPJ / legal package + biometrics if apps require Business | Pending |
| Claude Team/Enterprise org for directory portal | CAO-147 | Switch/login to ZapSign Team or Enterprise org with Directory access | **ACTIVE** |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify | Pending (prefer Worker route) |

---

## Next steps

1. Open the draft **Submit** section and click **Submit for Review**; the last read of Plugin issues before the browser dropped showed no `MCP is incomplete` entry. Record the submission ID and update CAO-148.
2. If the button is still disabled, read the Plugin issues list and clear the named section (Info icons, Prompts, Testing, or Global) — every other section was previously populated.
3. Human: Claude Team/Enterprise ZapSign org → directory submissions → fill from `docs/submission/anthropic.md`.
4. Optional: MCP Inspector production pass for 25 tools with `title` + four hints.

---

## Changelog

| Date | Event |
|---|---|
| 2026-07-31 | Phase 0 code/docs complete (`b3b32a3`, `e5b044a`, `7ae7f61`); prod `/privacy` was 404 until deploy |
| 2026-07-31 | Deploy OK (Version `adeae044…`); `/privacy` **200**; Phase 1 HARD GATE on CAO-147 comment `133026` + CAO-148 comment `133027`; OpenAI login gate merged from `openai-org-status.md` |
| 2026-07-31 | OpenAI login cleared; ZapSign org confirmed; Persona business verify started; Phase 1 local-token HARD GATE restated (CAO-147 `133093`); OpenAI challenge route implemented in code; plugin create blocked until identity verify |
| 2026-08-13 | Resume: session on local `main` (ahead of origin); demo token from AWS SM validated; Anthropic portal blocked (Max ≠ Team/Enterprise) — CAO-147 `134920`; OpenAI Create With MCP still gated on Persona email — CAO-148 `134921`; browser left on Persona confirm-email |
| 2026-08-13 | Continue after auth hard-stop: expired Persona inquiry recovered via OpenAI refresh → new `code=` session; polled ~10 min; email OTP not entered; submission not started; Phase 2A still blocked on Team/Enterprise |
| 2026-08-14 | Light continue after prior agent disconnect (before docs/Jira): Phase 2A still blocked (Claude Team/Enterprise); Phase 2B still hard-gated (Persona/identity incomplete); **no form submission attempted**; no submission IDs |
| 2026-08-14 | Preflight: typecheck+lint green; measurement privacy-URL expect fixed; full-suite 15s cold-start timeouts pass in isolation; push marketplace commits; CAO-147 inventory locked at **25 tools** |
| 2026-08-14 | Active specs committed (d4e1db3: docs/specs/mcp-marketplace-launch.md + core-12); preflight suite re-run green (typecheck/lint/359 tests); main == origin/main @ ee5708e |
| 2026-08-14 | Auth-submit resume (12:30 -03): ZapSign OpenAI org remained unverified; Business verification generated a fresh Persona inquiry and stopped at the human identity gate. Anthropic Team/Enterprise gate remains active. No submission IDs; Phase 3/4 not started. |
| 2026-08-14 | Auth-submit (13:55): started Persona **Individual** verify; inquiry `inq_Ab5jmhWpKCzNqhgewMpETYB511QJLU`; browser unlocked on **Continue on another device** (QR/camera). Claude Team/Enterprise still blocked. No submissions. |
| 2026-08-14 | Persona Individual identity completed. Created OpenAI draft `asdk_app_6a7f4a126ab88191a83a67cf744ca7da`; populated verified identity, listing URLs/copy/category, MCP URL, and OAuth. Generated `icon-openai.png`. OAuth tool scan stopped at one-time reviewer-token paste; token is on the local clipboard. |
| 2026-08-14 | OpenAI draft advanced through Testing (5 positive + 3 negative), Global (pt-BR + `BR MX CO US PT ES`), release notes, and policy attestations. Submit validation reports two remaining issues: required MCP tool scan and domain verification. First OAuth retry used a truncated UI preview and was rejected; complete AWS token revalidated **200**. Browser automation disconnected before the fresh retry; no submission. |
| 2026-08-14 | Deployed OpenAI challenge route (Worker Version `6e7c93d2…`) and verified `mcp.zapsign.com.br`. Corrected allowed countries into six persisted tags and checked final attestations via native controls. Fresh OAuth grants redirect successfully, but OpenAI still reports `MCP tools scan is required`; browser automation disconnected after retry. |
| 2026-08-14 | User completed ZapSign OAuth and redirected to OpenAI Platform (~16:01). Agent browser MCP (`cursor-ide-browser`) unavailable in this session; scan persistence and Submit not verified; no submission ID. |
| 2026-08-14 | Diagnosed OpenAI `401 invalid_client` on token exchange: ChatGPT CIMD `client.json` prefers `private_key_jwt` (also offers `none`); workers-oauth-provider **0.2.4** stores `private_key_jwt` but `/token` only accepts `none` or client secrets → invalid_client after successful authorize. Fix: upgrade to **0.10.3** + `clientIdMetadataDocumentEnabled: true`; not deployed this turn. |
| 2026-08-14 | Implemented the OAuth fix locally: upgraded workers-oauth-provider to **0.10.3**, enabled CIMD explicitly, preserved `global_fetch_strictly_public`, and added a focused configuration regression assertion. Typecheck, lint, and all 359 tests green; deploy and OpenAI OAuth/Scan Tools retry pending. |
| 2026-08-14 | Deployed OAuth fix as Worker Version `0685d70d-6b6f-433d-8f2b-d27d2bc082a5`. Production health is **200**; authorization metadata is **200**, advertises CIMD, and includes public-client token auth method `none`. Next: retry OpenAI Apps **Scan Tools** and confirm 25 tools. |
| 2026-08-14 | User reported OpenAI tools imported successfully after the OAuth fix. Attempt to continue the draft reached an organization-permission page: current Platform session lacks `api.apps.read`, so the imported count, remaining fields, and Submit for Review cannot be accessed. No submission ID. |
| 2026-08-14 | Draft access restored by setting **ZapSign** as the profile default organization (`Settings → Profile → Default organization`); the plugin edit form loads again. Note: `/settings/organization/people/roles` still returns “required permission: organization.read”, but Apps/plugin editing works. |
| 2026-08-14 | Verified the imported inventory in the draft: **25 tools**, 75 annotation justification fields, and hint values matching `src/tools/**` exactly (read-only: 5; destructive: `delete_document`, `delete_signer`, `delete_webhook`, `delete_webhook_header`, `update_partner_payment_status`; open-world: 25). Filled all **75** justifications, saved via **Continue**, and confirmed persistence after a full page reload. `MCP is incomplete` cleared from Plugin issues. Agent browser MCP disconnected repeatedly during the session; Submit for Review click not yet confirmed. |
| 2026-08-14 | Final-submit retry at 17:52 -03: MCP discovery returned no browser/Chrome/Playwright tool and no Atlassian/Jira tool. The Submit URL could not be opened, locked, snapshotted, or clicked; CAO-148 could not be commented. **No submission confirmation, ID, or status exists.** The only remaining OpenAI submission blocker is reconnecting `cursor-ide-browser`. |
