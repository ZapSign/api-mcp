---
name: mcp-growth-metrics
description: >-
  Captures and compares ZapSign MCP growth metrics (Google Trends BR search
  intent for zapsign api/mcp/chatgpt/claude, npm downloads for mcp-server-zapsign
  vs community packages, directory presence). Use when the user asks about MCP
  awareness, Trends, npm installs, growth snapshot, or how marketing is going
  over time.
---

# MCP growth metrics

## Canonical sources

- Trends (fixed URL — do not change query set):  
  https://trends.google.com/trends/explore?geo=BR&q=zapsign%20api,zapsign%20mcp,zapsign%20chatgpt,zapsign%20claude  
  Geo: Brazil. Default timeframe: Past 12 months.
- npm downloads API: `https://api.npmjs.org/downloads/point/{period}/{package}`  
  Packages: `mcp-server-zapsign` (official), `@marcelocorrea/mcp-zapsign` (benchmark).
- Snapshot store: `docs/marketing/snapshots/YYYY-MM-DD.json`
- Status log: `docs/marketing/STATUS.md`
- Official agent hub (always list under presence):  
  https://agents.zapsign.com.br · https://agents.zapsign.com.br/llms.txt

## Take a snapshot

1. Run from repo root:  
   `node scripts/marketing/take-snapshot.mjs`  
   (optional date: `node scripts/marketing/take-snapshot.mjs 2026-07-21`)
2. Open the Trends URL in the browser. Dismiss cookie banners. Wait until Interest over time and related tables load (Brazil, Past 12 months).
3. Read **relative interest** (0–100) for each term from the chart legend / average interest widgets. Never invent numbers. If blocked or empty, leave `null` and explain in `trends.notes`.
4. Update the snapshot JSON `trends.terms` and clear or rewrite `trends.notes`.
5. Load the previous snapshot (latest earlier `YYYY-MM-DD.json`) and compute deltas for npm `last_week` and Trends ranking among the four terms.
6. Append a short entry (5–10 lines) to `docs/marketing/STATUS.md` with date, npm WoW delta for the official package, Trends ranking, and any presence changes.

## Report format

```markdown
### YYYY-MM-DD
- npm mcp-server-zapsign: last_week=N (Δ vs prior snapshot)
- npm @marcelocorrea/mcp-zapsign: last_week=N
- Trends BR (past 12 mo): ranking of the four terms + values if known
- Presence notes
- Next focus (one line)
```

## Rules

- Same Trends URL every time (comparability).
- Trends values are relative within the query set — not absolute search volume.
- Do not scrape unofficial Trends APIs; use the browser UI.
- Do not modify product MCP tools for marketing.
