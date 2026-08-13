# ZapSign MCP growth metrics

Track search intent, package adoption, and shared marketing analytics for Agents + MCP.

## Shared analytics (live)

GA4 + Microsoft Clarity + Google Search Console cover marketing surfaces on:

- [agents.zapsign.com.br](https://agents.zapsign.com.br)
- [mcp.zapsign.com.br](https://mcp.zapsign.com.br) (`/docs`, `/mcp` landing)
- [mcp.zapsign.co](https://mcp.zapsign.co) (same Worker)

Consent Mode v2 + banner gate tags. OAuth `/authorize` is never instrumented.

Agent-created documents (STDIO and remote OAuth) are tagged with ZapSign create metadata `origin=mcp` on webhooks. Warehouse/analytics should filter webhook `metadata`, not `created_through` (that stays `api`).

Canonical IDs and admin notes: [`MEASUREMENT_IDS.md`](MEASUREMENT_IDS.md)  
Baseline checklist + 30-day ritual: [`SEO_CADENCE.md`](SEO_CADENCE.md)  
Privacy wording: [`../PRIVACY_POLICY_WEB.md`](../PRIVACY_POLICY_WEB.md) §4.5

Deployed wiring: Agents PR [#5](https://github.com/ZapSign/agents/pull/5), MCP PR [#22](https://github.com/ZapSign/api-mcp/pull/22).

## How to refresh (Trends / npm)

```bash
node scripts/marketing/take-snapshot.mjs
```

Then follow [`.cursor/skills/mcp-growth-metrics/SKILL.md`](../../.cursor/skills/mcp-growth-metrics/SKILL.md) (or the **mcp-marketing** agent) to fill Google Trends relative interest and append `STATUS.md`.

## Canonical Trends URL (do not change)

[Brazil · zapsign api / mcp / chatgpt / claude · past 12 months](https://trends.google.com/trends/explore?geo=BR&q=zapsign%20api,zapsign%20mcp,zapsign%20chatgpt,zapsign%20claude)

## Files

| Path | Purpose |
|------|---------|
| `MEASUREMENT_IDS.md` | Live GA4 / Clarity / GSC IDs + wiring |
| `SEO_CADENCE.md` | Baseline checklist + 30-day organic review ritual |
| `snapshots/YYYY-MM-DD.json` | Point-in-time Trends/npm metrics |
| `STATUS.md` | Human-readable deltas over time |
| `../../scripts/marketing/take-snapshot.mjs` | npm + scaffold writer |

## Official surfaces

| Surface | Role |
|---------|------|
| [mcp.zapsign.com.br/mcp](https://mcp.zapsign.com.br/mcp) | Remote MCP + OAuth |
| [agents.zapsign.com.br](https://agents.zapsign.com.br) | Tutorials hub (Claude/ChatGPT/Cursor/Codex/Gemini/API) |
| [agents.zapsign.com.br/llms.txt](https://agents.zapsign.com.br/llms.txt) | Agent-readable index of the hub |
| [`mcp-server-zapsign`](https://www.npmjs.com/package/mcp-server-zapsign) | Official npm package |
| [`@marcelocorrea/mcp-zapsign`](https://www.npmjs.com/package/@marcelocorrea/mcp-zapsign) | Community npm benchmark |

When refreshing presence, confirm the agents hub still points at this repo and the remote MCP URL.
