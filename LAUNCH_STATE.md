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
| 1 — Demo account | **Blocked** | HARD GATE: no `ZAPSIGN_API_TOKEN` / reviewer token in env — ask posted on CAO-147 + CAO-148 |
| 2A — Anthropic submit | Pending | Pack ready (`docs/submission/anthropic.md`); blocked on Phase 1 demo credentials |
| 2B — OpenAI submit | **Blocked (login)** | HARD GATE: no OpenAI Platform session — see OPENAI track + `docs/submission/openai-org-status.md` |
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

**Phase 0 commits (local main, ahead of origin by 3 — not required for deploy):**

| SHA | Summary |
|---|---|
| `b3b32a3` | `feat(privacy): serve GET /privacy for directory submissions` |
| `e5b044a` | `docs(submission): freeze 25-tool marketplace packs and launch state` |
| `7ae7f61` | `chore(marketing): record day-0 marketplace metrics baseline` |

Do **not** submit Anthropic/OpenAI directory forms until Phase 1 demo credentials exist (privacy is now live).

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

- [ ] Demo company + API token provisioned (HARD GATE — see below)
- [ ] Demo data loaded (3+ docs, 1 template, 2–3 signers)
- [ ] Token validated via `GET /api/v1/docs/`
- [ ] REVIEWER_GUIDE walkthrough E2E
- [ ] Freeze credentials until both reviews conclude

### C. Submission

- [ ] Fill form from `docs/submission/anthropic.md`
- [ ] Screenshot confirmation → attach here + CAO-147 comment
- [ ] Record submission date

### D. Follow-up until Live

- [ ] Monitor support@zapsign.com.br; respond &lt; 48h
- [ ] Weekly status; escalate mcp-review@anthropic.com after 3 weeks silence
- [ ] On approval: listing screenshot + fresh install + OAuth + `list_documents`
- [ ] E1 day-0 baseline logged

**Submission date:** _pending_  
**Live date:** _pending_

---

## OPENAI track (CAO-148)

Merged from `docs/submission/openai-org-status.md` (Phase 2B early agent).

### A. Org registration & verification

- [ ] ZapSign OpenAI org + Apps Management write
- [ ] Business / developer identity verification (HARD GATE — longest pole)
- [ ] Support contact registered (support@zapsign.com.br)
- [ ] Domain verification for `mcp.zapsign.com.br`

**HARD GATE (active) — OpenAI Platform login:** Cursor browser has no authenticated OpenAI session. `platform.openai.com` and `/plugins` redirect to login. Org existence, Apps Management Write, business verification, and support contact are **unknown** until a human provides ZapSign org login (+ 2FA when prompted). Do not invent credentials. After login: confirm org → grant Apps Management Write → start business verification → set support@zapsign.com.br → note domain challenge token (Worker `/.well-known/openai-apps-challenge`). Full notes: [`docs/submission/openai-org-status.md`](docs/submission/openai-org-status.md).

### B. Technical compliance

- [x] Public MCP URL documented; OAuth AS metadata OK
- [x] 25 tools with human titles + annotations in registry
- [x] CSP profiles documented in `docs/submission/openai.md`
- [ ] Stability/latency pass with demo account

### C. Listing assets & test materials

- [x] Frozen copy in `docs/submission/openai.md` (starter prompts, 5+/3− cases, countries)
- [ ] Demo credentials (shared with Anthropic track — Phase 1 HARD GATE)

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
| Demo/reviewer ZapSign API token | CAO-147 (+148) | Dedicated sandbox/reviewer company + token; env/secure handoff only | **ACTIVE** — Phase 1 blocked |
| Deploy `/privacy` | CAO-147 | `wrangler deploy` with Cloudflare account access | **Cleared** — privacy 200 |
| OpenAI 2FA / org login | CAO-148 | Authenticated ZapSign Platform session | **ACTIVE** |
| OpenAI business verification docs | CAO-148 | CNPJ / legal package | Pending (after login) |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify | Pending (prefer Worker route) |

### Phase 1 HARD GATE — precise ask

- **What:** Dedicated ZapSign reviewer/demo company API token (sandbox OK)
- **Where:** Secure handoff / env `ZAPSIGN_API_TOKEN` only — never in git/URL
- **Why:** Directory reviewer credentials + pre-loaded demo data for Anthropic + OpenAI
- **Expected artifact:** Validated token that can `GET https://api.zapsign.com.br/api/v1/docs/?page=1` plus company with 3 docs (pending/signed/mixed), 1 DOCX template with `{{client_name}}`, `{{address}}`, `{{contract_date}}`, 2–3 signers

---

## Next steps

1. Human: provision Phase 1 demo token into env / secure handoff → load demo data → E2E REVIEWER_GUIDE → freeze.
2. Human: OpenAI Platform login for ZapSign org → start business verification + domain challenge.
3. After (1): Phase 2A Anthropic form submit + Phase 2B OpenAI plugin submit (not before).
4. Optional: MCP Inspector production pass for 25 tools with `title` + four hints.

---

## Changelog

| Date | Event |
|---|---|
| 2026-07-31 | Phase 0 code/docs complete (`b3b32a3`, `e5b044a`, `7ae7f61`); prod `/privacy` was 404 until deploy |
| 2026-07-31 | Deploy OK (Version `adeae044…`); `/privacy` **200**; Phase 1 HARD GATE on CAO-147 comment `133026` + CAO-148 comment `133027`; OpenAI login gate merged from `openai-org-status.md` |
