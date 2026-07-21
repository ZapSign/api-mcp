# Agents & MCP measurement IDs

Shared GA4 + Clarity for marketing surfaces only (`agents.zapsign.com.br`, `mcp.zapsign.com.br`, `mcp.zapsign.co`). Do not use on `/authorize`.

| System | ID | Status |
|--------|----|--------|
| GA4 Measurement ID | `G-GNJFSQFD50` | Created 2026-07-21 |
| Microsoft Clarity Project ID | `xq06022ata` | Created 2026-07-21 |
| Google Search Console | _in progress_ | URL-prefix properties for agents + mcp hosts |

## GA4

- **Account:** ZapSign Agents MCP
- **Property:** ZapSign Agents & MCP
- **Timezone / currency:** America/Sao_Paulo · BRL
- **Measurement ID:** `G-GNJFSQFD50`
- **Web stream:** ZapSign Agents & MCP Web → `https://agents.zapsign.com.br` (Stream ID `15297904097`)
- **Enhanced measurement:** ON
- **Google signals:** leave OFF until consent is live (default for new property)
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
- **Additional hosts:** install the same Project ID on `mcp.zapsign.com.br` and `mcp.zapsign.co` (Clarity has no separate multi-domain admin field; hostname filter in dashboard)
- **Admin URL:** https://clarity.microsoft.com/projects/view/xq06022ata/

## Google Search Console

URL-prefix properties (or domain DNS verify if easier):

- `https://agents.zapsign.com.br` — submit sitemap `https://agents.zapsign.com.br/sitemap.xml`
- `https://mcp.zapsign.com.br`
- `https://mcp.zapsign.co`

## Wiring

| Surface | Where IDs live |
|---------|----------------|
| MCP Worker | `wrangler.jsonc` → `vars.GA4_MEASUREMENT_ID`, `vars.CLARITY_PROJECT_ID` |
| Agents hub | `js/analytics.js` constants |

Public measurement IDs are fine in client JS / Wrangler vars. Keep GA4 / Clarity / GSC admin access in the password manager — do not commit credentials.
