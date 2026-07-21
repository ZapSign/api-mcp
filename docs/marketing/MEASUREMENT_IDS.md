# Agents & MCP measurement IDs

Shared GA4 + Clarity for marketing surfaces only (`agents.zapsign.com.br`, `mcp.zapsign.com.br`, `mcp.zapsign.co`). Do not use on `/authorize`.

Consent Mode v2 + banner on both products. Tags load only after Accept.

| System | ID | Status |
|--------|----|--------|
| GA4 Measurement ID | `G-GNJFSQFD50` | Live (deployed 2026-07-21) |
| Microsoft Clarity Project ID | `xq06022ata` | Live (deployed 2026-07-21) |
| Google Search Console | partial | Agents verified + sitemap Success; MCP hosts pending |

## GA4

- **Account:** ZapSign Agents MCP
- **Property:** ZapSign Agents & MCP
- **Timezone / currency:** America/Sao_Paulo · BRL
- **Measurement ID:** `G-GNJFSQFD50`
- **Web stream:** ZapSign Agents & MCP Web → `https://agents.zapsign.com.br` (Stream ID `15297904097`)
- **Enhanced measurement:** ON
- **Google signals:** leave OFF until legal/marketing explicitly enables (consent is live; signals still gated)
- **Cross-domain hosts (configure in Admin → Data streams → Configure tag settings → Configure your domains):**
  - `agents.zapsign.com.br`
  - `mcp.zapsign.com.br`
  - `mcp.zapsign.co`
- **Admin:** https://analytics.google.com/analytics/web/#/a401847367p546473578/admin
- **Owner:** `andre@zapsign.com.br`

> Note: Configure-your-domains opens inside a Google Tag Manager lite iframe; complete that step manually in Admin if automation cannot interact with the iframe.

## Clarity

- **Project name:** ZapSign Agents & MCP
- **Project ID:** `xq06022ata`
- **Primary website URL:** `https://agents.zapsign.com.br`
- **Masking:** Strict (all text masked) — set 2026-07-21
- **Additional hosts:** same Project ID on `mcp.zapsign.com.br` and `mcp.zapsign.co` (Clarity has no separate multi-domain admin field; filter by hostname in the dashboard)
- **Admin URL:** https://clarity.microsoft.com/projects/view/xq06022ata/

## Google Search Console

| Property | Status | Notes |
|----------|--------|-------|
| `https://agents.zapsign.com.br/` | Verified (HTML file) | Sitemap `sitemap.xml` submitted 2026-07-21 — Status Success, 8 pages |
| `https://mcp.zapsign.com.br/` | Pending | Needs HTML file route on Worker, meta tag, or DNS TXT |
| `https://mcp.zapsign.co/` | Pending | Same as `.com.br` (same Worker) |

Agents verification file (keep deployed): `googlef22ed0de1a97f69e.html`

GA4 cross-domain hosts still need a one-time Admin pass (GTM lite iframe): Configure tag settings → Configure your domains.

## Wiring (deployed)

| Surface | Where IDs live | Ship |
|---------|----------------|------|
| MCP Worker | `wrangler.jsonc` → `vars.GA4_MEASUREMENT_ID`, `vars.CLARITY_PROJECT_ID` | PR [#22](https://github.com/ZapSign/api-mcp/pull/22) |
| Agents hub | `js/analytics.js` constants | PR [#5](https://github.com/ZapSign/agents/pull/5) |

MCP scope: `/docs` + `/mcp` browser landing only — never `/authorize`.

Public measurement IDs are fine in client JS / Wrangler vars. Keep GA4 / Clarity / GSC admin access in the password manager — do not commit credentials.

See also: [`SEO_CADENCE.md`](SEO_CADENCE.md), [`README.md`](README.md).
