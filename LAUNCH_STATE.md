# MCP Marketplace Dual Publication — Launch State

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
| 2A — Anthropic submit | **Blocked** | Portal requires Claude **Team/Enterprise** org; current session is individual **Max** (Andre Chaves) |
| 2B — OpenAI submit | **Hard-gated** | ZapSign org Owner OK; Create plugin With MCP blocked until Persona business verify; session refreshed 2026-08-13; email code still HARD GATE |
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
| OpenAI challenge route (code) | **Implemented** | `GET /.well-known/openai-apps-challenge` via `OPENAI_APPS_CHALLENGE_TOKEN` (not deployed until portal token exists) |

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

**BLOCKER (2026-08-13):** Remote submissions use in-app portal `https://claude.ai/admin-settings/directory/submissions/new`. Requires Claude **Team or Enterprise** org + Directory management access. Authenticated session is individual **Max** (Andre Chaves) → “organization settings available on Team and Enterprise only.” Jira comment `134920`.

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
- [ ] Business / developer identity verification (Persona — **Identity incomplete**)
- [ ] Support contact registered (support@zapsign.com.br) — listing form blocked until verify
- [ ] Domain verification for `mcp.zapsign.com.br` (Worker route ready; token not issued yet)

**HARD GATE (active) — Persona email code:** Prior inquiry session expired; refreshed via OpenAI `PUT /v1/dashboard/organizations/verifications` (new one-time `code=` link). Browser unlocked on “Confirm your email address” (5-digit code → `andre@zapsign.com.br`). ~10 min poll: still on confirm-email (transient Persona “network issues” toast once). Create plugin With MCP still blocked until Persona finishes. Details: [`docs/submission/openai-org-status.md`](docs/submission/openai-org-status.md).

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
| Persona email confirmation code | CAO-148 | 5-digit code to `andre@zapsign.com.br` on refreshed Persona tab (or complete manually) | **ACTIVE** — session refreshed; awaiting code |
| OpenAI business verification docs | CAO-148 | CNPJ / legal package + biometrics in Persona (after email code) | Pending |
| Claude Team/Enterprise org for directory portal | CAO-147 | Switch/login to ZapSign Team or Enterprise org with Directory access | **ACTIVE** |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify | Pending (prefer Worker route) |

---

## Next steps

1. Human: enter Persona 5-digit email code on open Persona tab → finish business ID/CNPJ/biometrics.
2. After Persona: Create plugin With MCP → domain challenge secret → deploy → submit listing (`docs/submission/openai.md`).
3. Human: Claude Team/Enterprise ZapSign org → `https://claude.ai/admin-settings/directory/submissions/new` → fill from `docs/submission/anthropic.md`.
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
