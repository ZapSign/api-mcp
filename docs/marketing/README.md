# ZapSign MCP growth metrics

Track search intent and package adoption for the official MCP server over time.

## How to refresh

```bash
node scripts/marketing/take-snapshot.mjs
```

Then follow [`.cursor/skills/mcp-growth-metrics/SKILL.md`](../../.cursor/skills/mcp-growth-metrics/SKILL.md) (or the **mcp-marketing** agent) to fill Google Trends relative interest and append `STATUS.md`.

## Canonical Trends URL (do not change)

[Brazil · zapsign api / mcp / chatgpt / claude · past 12 months](https://trends.google.com/trends/explore?geo=BR&q=zapsign%20api,zapsign%20mcp,zapsign%20chatgpt,zapsign%20claude)

## Files

| Path | Purpose |
|------|---------|
| `snapshots/YYYY-MM-DD.json` | Point-in-time metrics |
| `STATUS.md` | Human-readable deltas over time |
| `../../scripts/marketing/take-snapshot.mjs` | npm + scaffold writer |

## Packages

| Package | Role |
|---------|------|
| [`mcp-server-zapsign`](https://www.npmjs.com/package/mcp-server-zapsign) | Official |
| [`@marcelocorrea/mcp-zapsign`](https://www.npmjs.com/package/@marcelocorrea/mcp-zapsign) | Community benchmark |
