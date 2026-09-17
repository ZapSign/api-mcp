# MCP Marketplace Dual Publication — Launch State

**Last updated:** 2026-09-17 08:20 UTC — Anthropic slug **`zapsign`** remains **Em revisão**; OpenAI version `1.0.1` shows **Rejected** in the portal (observed live 2026-09-17; no new rejection email retrieved this session — reason not independently confirmed for this specific version). Before resubmitting, found and fixed a stale `get_signer` tool-justification that still described returning geolocation after the response-allowlist fix (PR #42) removed it. Corrective version **`1.0.2`** was submitted 2026-09-17 with the allowlist fix live, the corrected justification, and a fresh MCP tool scan against the deployed Worker. Phase 4 remains blocked until both Live.

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
| 2A — Anthropic submit | **Submitted — in review (2026-08-17)** | Team org **Zapsign CAO**; OAuth connected; **25 tools** captured; **Enviar para revisão** confirmed. Slug/ID **`zapsign`**; status **Em revisão**. Portal: `https://claude.ai/admin-settings/directory/submissions/zapsign`. Evidence: `docs/submission/evidence/anthropic-submitted-zapsign-2026-08-17.png`. |
| 2B — OpenAI submit | **Second corrective version in review (2026-09-17)** | Version `1.0.0` was rejected; corrective `1.0.1` also shows **Rejected** in the portal. Response-allowlist fix (PR #42) deployed, `get_signer` justification corrected, MCP rescanned; version `1.0.2` submitted and shows `Review`. Both rejected versions remain immutable. |
| 3 — Follow-up until Live | In progress — both in review | OpenAI version `1.0.2` is **Review**; Anthropic remains **Em revisão**. No gate-to-12 until both Live. |
| 4 — Close-out + gate to 12 | Pending | After both Live |

---

## Production endpoint evidence (rechecked 2026-08-28)

| Check | Result | Evidence |
|---|---|---|
| `GET https://mcp.zapsign.com.br/health` | **200** | `{"status":"ok","version":"2.0.0",...}` |
| `GET https://mcp.zapsign.com.br/privacy` | **200** | HTML includes “Privacy Policy” + “ZapSign MCP” |
| `GET https://mcp.zapsign.com.br/docs` | **200** | Public docs page |
| `GET https://mcp.zapsign.com.br/mcp` | **401** | `invalid_token` / Missing or invalid access token (expected) |
| `GET https://mcp.zapsign.com.br/.well-known/oauth-authorization-server` | **200** | issuer `https://mcp.zapsign.com.br`; CIMD enabled; token auth methods include `none`; scopes include documents/signers/templates/webhooks/partner |
| Deploy | **OK** | `npm run deploy` → `zapsign-mcp`; Version ID `adeae044-b5bb-4980-a1fd-ccc0c74bf15a`; custom domains `mcp.zapsign.com.br`, `mcp.zapsign.co` |
| Registry tool count | **25** | `src/tools/registry.ts`; public `/docs` response contains 25 tool references |
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

- [x] Fill form from `docs/submission/anthropic.md` (25 tools; `https://mcp.zapsign.com.br/mcp`; categories Productivity + Legal)
- [x] Screenshot confirmation → `docs/submission/evidence/anthropic-submitted-zapsign-2026-08-17.png` + CAO-147 comment
- [x] Record submission date

**Submitted (2026-08-17 ~15:27 -03):** Claude Team org **Zapsign CAO** (Andre · Equipe). In-app wizard completed: Connection OAuth → **25 tools** / Auth OAuth; Listing (ZapSign / slug `zapsign`); Use cases + read_write; Company ZapSign; Auth `oauth_dcr`; Data handling first_party / no PHI / no sponsored; Compliance attestations; **Enviar para revisão**. Confirmation: “Servidor enviado para revisão” · slug **`zapsign`** · status **Em revisão**. Post-submit edit corrected Privacy Policy URL to `https://mcp.zapsign.com.br/privacy` (initial submit briefly had favicon URL from icon field mix-up; **Salvar alterações** applied).

**Submission date:** 2026-08-17  
**Submission ID / slug:** `zapsign`  
**Portal:** https://claude.ai/admin-settings/directory/submissions/zapsign  
**Live date:** _pending_

### D. Follow-up until Live

- [x] **Listing enhancement (in review, 2026-08-17 ~16:20 -03):** While **Em revisão**, **Editar servidor** remains editable (slug locked). Saved: logo URL `https://raw.githubusercontent.com/ZapSign/api-mcp/main/icon.svg`; permissions summary; Primary use cases (3 frozen prompts); Claude API copy snippet. Confirmed unchanged/correct: tagline, description, docs `https://mcp.zapsign.com.br/docs`, privacy `https://mcp.zapsign.com.br/privacy`, support `support@zapsign.com.br`, author ZapSign / `https://zapsign.com.br/`. Toast **Alterações salvas.** Evidence: `docs/submission/evidence/anthropic-enhanced-zapsign-2026-08-17.png` (+ logo/permissions/usecases field shots). Asset: `docs/submission/assets/zapsign-anthropic-logo.png`. Runner: `scripts/submission/enhance-anthropic-listing.cjs`. Carousel file upload UI not available (logo via URL). Categories left as submitted (Productivity + Legal).
- [ ] Monitor support@zapsign.com.br; respond &lt; 48h
- [x] **Status request sent (2026-08-28 ~18:56 -03):** emailed `mcp-review@anthropic.com` with slug `zapsign`, canonical MCP URL, submission URL, two-week review age, and offer to provide reviewer access or changes; Gmail confirmed **Message sent**. Await response and continue monitoring.
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

**Fix deployed and scan succeeded:** bumped `@cloudflare/workers-oauth-provider` to `^0.10.3` (resolved 0.10.3), set `clientIdMetadataDocumentEnabled: true` on `OAuthProvider`, and preserved `global_fetch_strictly_public`. Typecheck, lint, focused OAuth configuration test, and all 359 tests pass. Worker `0685d70d-6b6f-433d-8f2b-d27d2bc082a5` is live; health returns 200 and production metadata advertises CIMD plus token endpoint auth methods `client_secret_basic`, `client_secret_post`, and `none`. OpenAI imported **25 tools**, and all **75** annotation justifications were verified and persisted. The rejected version was later replaced by corrective draft `1.0.1`; its MCP rescan is waiting for the reviewer API token in the OAuth form.

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
- [x] Submit via platform portal (2026-08-17 — version status `Review`)
- [x] Screenshot + CAO-148 comment (portal screenshot captured during submit session)
- [x] Corrective version `1.0.1` also came back **Rejected** (observed live 2026-09-17)
- [x] Second corrective version `1.0.2` submitted 2026-09-17 with the response-allowlist fix (PR #42/#43/#44 on `ZapSign/api-mcp`), corrected `get_signer` justification, and fresh MCP tool scan; status `Review`
- [ ] Follow-up until Live; E2 day-0 baseline

**Submission date:** 2026-08-17  
**Submission handle:** app `asdk_app_6a7f4a126ab88191a83a67cf744ca7da` / version `asdk_app_v_6a7f4a136fb08191abc40efc7e45c499` (status `Rejected`)
**Corrective submission:** version `1.0.1` (status `Rejected`, same app handle)
**Second corrective submission:** version `1.0.2` (status `Review`, submitted 2026-09-17; see `docs/submission/openai-resubmission-evidence.md`)
**Live date:** _pending_

### E. Rejection recovery (2026-08-28)

- [x] **Authoritative reason obtained:** OpenAI email `openai-review@tm.openai.com`, subject `Envio de plugin do ChatGPT rejeitado [asdk_app_6a7f4a126ab88191a83a67cf744ca7da]`; evidence captured as `docs/submission/evidence/openai-rejected-email-2026-08-28.png`.
- [x] **Reviewer findings recorded:** one or more submitted test cases returned incorrect results; the app requested restricted data (health, biometric, CPF, and payment-card information); a call returned unnecessary personal identifiers; returned user-related data was absent from the privacy policy; and one or more tool annotations did not match behavior or lacked explicit justification.
- [x] **Corrective regression coverage:** hermetic tests cover response minimization, rejection of CPF/CNPJ and unbounded payment details, privacy-policy disclosure, and destructive annotation for batch signing.
- [x] **Local correction:** successful tool responses now remove unnecessary identifiers, contact fields, government/biometric/geolocation fields, raw metadata, and payment processor details; partner/payment schemas reject restricted fields; batch signing is marked destructive; privacy policy and OpenAI response expectations were updated.
- [x] **Correction deployed:** production health, privacy, docs, OAuth metadata, protected MCP response, and public docs tool count rechecked on 2026-08-28 without a real ZapSign API call.
- [x] **Corrective draft created:** OpenAI version `1.0.1` is editable at the same app handle; canonical URL remains `https://mcp.zapsign.com.br/mcp`.
- [x] Complete the MCP rescan, verify 25 tools and all 75 annotation justifications, upload the corrected Skills bundle, and submit version `1.0.1` for review.

### F. Second rejection recovery (2026-09-17)

- [x] **Verified live, not assumed:** confirmed PR #42 (`mcp/redact-openai-allowlist`) was still unmerged on `origin/main` with the allowlist fix, unit suite 423/423 green, `src/utils/response-filter.ts` matches the documented allowlist.
- [x] **Deploy blocker resolved without recurring Cloudflare login:** added `.github/workflows/deploy.yml` (PR #43) — `workflow_dispatch` + `CLOUDFLARE_API_TOKEN` repo secret, no `wrangler login`. Merged #43, then #42, then dispatched the deploy — Worker Version `63412fb4-66ec-45e2-bb25-471ab1f033b0` live; both custom domains updated.
- [x] **Live verification:** `GET https://mcp.zapsign.com.br/privacy` diffed before/after deploy — new field-level disclosure table (biometric, liveness, geolocation, "We do not expose") confirmed live.
- [x] **Portal review before resubmit:** opened version `1.0.1` in the OpenAI Plugins portal — found it already **Rejected**. Used "Edit" to fork an editable draft, bumped to `1.0.2`, re-selected Developer Identity (reset on fork).
- [x] **Found and fixed a real annotation/behavior mismatch:** `get_signer`'s "Read Only" justification still said it returns "optional geolocation" (and a nonexistent "view count") — stale from before the allowlist fix. Corrected to list only the fields actually returned (`token, name, status, status_code, signed_at, qualification, auth_mode`, +email for account owners).
- [x] **Re-scanned tools live:** ran "Scan Tools" against the deployed Worker via OAuth (ZapSign API token entered directly by the account owner in-browser, never shared with the agent) — 0 console errors, all 25 tools + justifications intact post-scan.
- [x] **Skills, Testing, Global tabs reviewed:** all 3 skills already `Passed`; 5 test cases + 3 negative cases still accurate against the new response shape; countries/translations unchanged from `docs/submission/openai.md`.
- [x] **Submitted:** version `1.0.2` for review with release notes describing the allowlist fix; portal confirms status `Review`, locked (View/Download/Cancel only — no further Edit).

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
| OpenAI MCP tool scan / submit | CAO-148 | Verify 25 imported tools, complete required fields, then Submit for Review | **CLEARED** — corrected Skills bundle uploaded; version `1.0.1` submitted and shows `Review` |
| OpenAI Business verification (optional after Individual) | CAO-148 | CNPJ / legal package + biometrics if apps require Business | Pending |
| Claude Team/Enterprise org for directory portal | CAO-147 | Switch/login to ZapSign Team or Enterprise org with Directory access | **CLEARED** — Team org **Zapsign CAO**; submission `zapsign` in review 2026-08-17 |
| DNS if well-known insufficient | CAO-148 | TXT/CNAME for domain verify | Pending (prefer Worker route) |

---

## Next steps

1. Monitor Anthropic review for slug **`zapsign`** (`Em revisão` → published); portal `https://claude.ai/admin-settings/directory/submissions/zapsign`; escalate mcp-review@anthropic.com after 3 weeks silence.
2. Monitor OpenAI version `1.0.1` through approval/Live; keep version `asdk_app_v_6a7f4a136fb08191abc40efc7e45c499` as the immutable rejected baseline and keep the demo token frozen.
3. Optional: MCP Inspector production pass for 25 tools with `title` + four hints.
4. After both listings are Live: log E1/E2 day-0 baselines, then start Phase 4 core-12 gate.

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
| 2026-08-17 | Anthropic retry: reopened `https://claude.ai/admin-settings/directory/submissions/new` in the system browser and left it there for the Team/Enterprise organization handoff. No browser automation was available to inspect or submit the form; last verified account remains individual Max. **No Anthropic submission ID.** |
| 2026-08-17 | Auth-gate follow-up (~12:28): reopened submissions URL; `cursor-ide-browser` flickered (saw OpenAI Platform tab only) then dropped; could not lock/snapshot Claude directory form. **Still waiting on Team/Enterprise login; no submission.** |
| 2026-08-17 | **OpenAI Submit for Review completed (~12:50 -03).** Human completed Google SSO in an agent-driven Chrome session; the Platform session defaulted to the **Personal** org (empty plugin list, `api.apps.read` denial on the draft), so the active org was switched to ZapSign (`org-zytAEIEHDhfBrgREh8gTiYUA`) and the draft reloaded. Verified Info (name/version/subtitle/description/category/identity/URLs), Testing (5 positive + 3 negative cases, reviewer credentials), Global (en-US + pt-BR, `BR MX CO US PT ES`), release notes, 7/7 policy attestations, and all-ages rating; no Skills upload was required. Clicked **Submit for Review** — portal now lists version `1.0.0` as **`Review`** (app `asdk_app_6a7f4a126ab88191a83a67cf744ca7da`, version `asdk_app_v_6a7f4a136fb08191abc40efc7e45c499`). OpenAI exposes no separate submission ID. |
| 2026-08-17 | **Anthropic directory submitted (~15:27 -03).** User upgraded to Claude **Team**; org **Zapsign CAO**. Wizard filled from `docs/submission/anthropic.md`: OAuth to `https://mcp.zapsign.com.br/mcp`, **25 tools** captured, listing ZapSign / slug `zapsign`, categories Productivity+Legal, docs/support/privacy, use-case prompts, company ZapSign, `oauth_dcr`, first_party data handling. Confirmation **Servidor enviado para revisão**; portal status **Em revisão** at `https://claude.ai/admin-settings/directory/submissions/zapsign`. Post-submit **Salvar alterações** corrected Privacy Policy URL to `https://mcp.zapsign.com.br/privacy`. Evidence PNG under `docs/submission/evidence/`. Phase 4 still pending both Live. |
| 2026-08-17 | **Listing enhance blocked on auth (~16:12 -03).** `cursor-ide-browser` unavailable/unstable; Playwright runner opened portal on `claude.ai/login`. Logo prepared: `docs/submission/assets/zapsign-anthropic-logo.png`. Evidence: `anthropic-auth-gate-2026-08-17.png`. |
| 2026-08-17 | **Anthropic listing enhanced while Em revisão (~16:20 -03).** After Zapsign CAO login in automation profile: saved logo URL (GitHub `icon.svg`), permissions summary, 3 starter use-cases, Claude API snippet; confirmed docs/privacy/support/tagline/description. Slug locked; metrics locked until published. Toast **Alterações salvas.** Evidence `docs/submission/evidence/anthropic-enhanced-*.png`. OpenAI not touched. Phase 4 not started. |
| 2026-08-28 | **OpenAI rejection feedback obtained by email.** Version `1.0.0` was rejected for incorrect test-case results, restricted-data requests (health/biometric/CPF/payment-card), unnecessary personal identifiers, incomplete privacy disclosure, and annotation mismatch/justification. Evidence captured as `docs/submission/evidence/openai-rejected-email-2026-08-28.png`; local corrective tests are green for the focused suite. |
| 2026-08-28 | **Anthropic status request sent.** Emailed `mcp-review@anthropic.com` for the `zapsign` submission after approximately two weeks in review; Gmail confirmed delivery. |
| 2026-08-28 | **OpenAI corrective draft prepared.** Privacy-minimizing response and input corrections were deployed; production preflight returned health/privacy/docs/OAuth **200**, protected MCP **401** as expected, and public docs exposed 25 tool references. Draft `1.0.1` is saved; MCP rescan is waiting for reviewer API token entry. |
| 2026-08-31 | **OpenAI corrective version submitted.** The Skills ZIP was rebuilt with `skills/` as its single root directory, uploaded to version `1.0.1`, and the OpenAI portal now shows status `Review`. |
| 2026-09-17 | **PR #42 merged + deployed via new GitHub Actions workflow (agent-driven, browser MCP for the portal work).** Verified PR #42 (`mcp/redact-openai-allowlist`, response-allowlist fix) was still open and unmerged, unit suite 423/423 green. Added `.github/workflows/deploy.yml` (PR #43) so `wrangler deploy` runs in CI via a `CLOUDFLARE_API_TOKEN` repo secret instead of interactive `wrangler login`. Merged #43 then #42 to `main`; dispatched the deploy — Worker Version `63412fb4-66ec-45e2-bb25-471ab1f033b0` live, both custom domains updated. `GET /privacy` diffed before/after: new field-level disclosure table confirmed live. Filed PR #44 updating `docs/submission/openai-resubmission-evidence.md` with this evidence. |
| 2026-09-17 | **OpenAI version `1.0.1` found Rejected; second corrective version `1.0.2` submitted.** Opened the Plugins portal (ZapSign org) — `1.0.1` showed **Rejected** (no fresh rejection email retrieved this session). Forked an editable draft via "Edit", bumped version to `1.0.2`, re-selected Developer Identity (reset on fork). Found `get_signer`'s "Read Only" tool justification still claimed to return "optional geolocation" (and a nonexistent "view count") — stale from before the allowlist fix; corrected the text to the actual returned fields. Ran "Scan Tools" against the live Worker (ZapSign OAuth; account owner entered their own ZapSign API token directly in-browser, never shared with the agent) — 0 console errors, 25 tools + justifications intact. Skills (3, all `Passed`), Testing (5 + 3 negative cases), and Global tabs reviewed with no changes needed. Updated release notes to describe the allowlist fix and clicked **Submit for Review**. Portal confirms version `1.0.2` status `Review`, locked to View/Download/Cancel only. |
