# SEO & analytics cadence — Agents + MCP

Shared measurement for `agents.zapsign.com.br`, `mcp.zapsign.com.br`, and `mcp.zapsign.co` (marketing HTML only). OAuth `/authorize` is never instrumented.

## Baseline checklist (run once after IDs go live)

### Google Analytics 4

- [ ] Property `ZapSign Agents & MCP` receives realtime hits from Agents home and MCP `/docs` after consent Accept
- [ ] Hostname dimension separates `agents.*` vs `mcp.*`
- [ ] Enhanced measurement enabled on the web stream
- [ ] Google signals left OFF until legal/marketing approves
- [ ] Custom events (when Agents ships them): `cta_signup`, `cta_api_token`, `cta_github`, `tutorial_copy_code`

### Microsoft Clarity

- [ ] Project includes Agents + both MCP hostnames
- [ ] Input / sensitive content masking enabled
- [ ] Recording appears for Agents home after consent; no sessions from `/authorize`
- [ ] Optional: Clarity ↔ GA4 link once both IDs exist

### Google Search Console

- [ ] Properties verified: `https://agents.zapsign.com.br`, `https://mcp.zapsign.com.br`, `https://mcp.zapsign.co`
- [ ] Agents sitemap submitted: `https://agents.zapsign.com.br/sitemap.xml` → status Success
- [ ] MCP: note coverage for `/docs` (and `/mcp` landing if indexed); add `sitemap.xml` later if missing

### Privacy / consent

- [ ] Consent banner shows on Agents + MCP marketing pages before tags fire
- [ ] Reject keeps analytics denied; Accept loads GA4 + Clarity
- [ ] Footer privacy links present on `/docs` and `/mcp` landing
- [ ] `docs/PRIVACY_POLICY_WEB.md` reflects marketing analytics after consent

## 30-day organic review ritual

Run every ~30 days (or after major content ships). Record date + owner in the team channel.

### 1. Traffic & engagement (GA4)

1. Landing pages report: Agents home; Claude / ChatGPT / Cursor tutorials; MCP `/docs`, `/mcp`
2. Traffic by hostname (`agents` vs `mcp`)
3. Outbound conversions / CTAs (signup, API integrations, GitHub)
4. Engagement: scroll depth / engaged sessions on top tutorials
5. Compare vs previous 30 days; note one win and one drop with a hypothesis

### 2. UX friction (Clarity)

1. Heatmaps for Agents home and the top 2–3 tutorials by traffic
2. Rage clicks on connector CTAs
3. Watch 3–5 recent recordings for confusion on “add connector” steps
4. Confirm authorize remains absent from Clarity (never tagged)

### 3. Search performance (GSC)

1. Queries / pages / CTR for Agents tutorials (last 28 days)
2. Coverage / indexing errors; fix or file follow-ups
3. Refresh `sitemap.xml` `lastmod` when tutorial content shipped
4. Note impressions before/after content updates

### 4. Actions for next sprint

- [ ] One content fix (title, intro, or CTA) from GSC/Clarity evidence
- [ ] One measurement fix if an event or hostname filter is wrong
- [ ] Update `docs/marketing/STATUS.md` if package/search snapshots were refreshed

## ID storage

Public measurement IDs may live in Wrangler `vars` (`GA4_MEASUREMENT_ID`, `CLARITY_PROJECT_ID`) and, when available, `docs/marketing/MEASUREMENT_IDS.md`. Admin access to GA4 / Clarity / GSC stays in the password manager — do not commit credentials.
