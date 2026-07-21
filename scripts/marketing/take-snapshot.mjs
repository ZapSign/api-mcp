#!/usr/bin/env node
/**
 * Writes docs/marketing/snapshots/YYYY-MM-DD.json with npm download stats.
 * Trends fields are left null for the agent/skill to fill via Google Trends UI.
 *
 * Usage: node scripts/marketing/take-snapshot.mjs [YYYY-MM-DD]
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TRENDS_URL =
  'https://trends.google.com/trends/explore?geo=BR&q=zapsign%20api,zapsign%20mcp,zapsign%20chatgpt,zapsign%20claude';
const OFFICIAL_PKG = 'mcp-server-zapsign';
const BENCHMARK_PKG = '@marcelocorrea/mcp-zapsign';
const PERIODS = ['last-day', 'last-week', 'last-month'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const snapshotsDir = path.join(repoRoot, 'docs/marketing/snapshots');

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function periodKey(period) {
  return period.replace('-', '_');
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchNpmDownloads(packageName) {
  const encoded = encodeURIComponent(packageName);
  const result = {
    last_day: null,
    last_week: null,
    last_month: null,
    version: null,
  };

  for (const period of PERIODS) {
    const data = await fetchJson(
      `https://api.npmjs.org/downloads/point/${period}/${encoded}`,
    );
    result[periodKey(period)] = data.downloads ?? null;
  }

  const meta = await fetchJson(`https://registry.npmjs.org/${encoded}`);
  result.version = meta?.['dist-tags']?.latest ?? null;
  return result;
}

function emptyTrends() {
  return {
    source_url: TRENDS_URL,
    timeframe: 'past_12_months',
    terms: {
      'zapsign api': null,
      'zapsign mcp': null,
      'zapsign chatgpt': null,
      'zapsign claude': null,
    },
    notes: 'Fill relative interest (0-100) from Trends UI; do not invent values.',
  };
}

function defaultPresence() {
  return {
    remote_mcp: 'https://mcp.zapsign.com.br/mcp',
    agents_hub: 'https://agents.zapsign.com.br',
    agents_llms_txt: 'https://agents.zapsign.com.br/llms.txt',
    listings: [
      {
        name: 'agents.zapsign.com.br',
        url: 'https://agents.zapsign.com.br',
        status: 'official',
      },
      {
        name: 'agents.zapsign.com.br/llms.txt',
        url: 'https://agents.zapsign.com.br/llms.txt',
        status: 'official',
      },
      {
        name: 'npm mcp-server-zapsign',
        url: 'https://www.npmjs.com/package/mcp-server-zapsign',
        status: 'listed',
      },
      {
        name: 'mcp.ai/zapsign',
        url: 'https://mcp.ai/zapsign',
        status: 'third_party',
      },
      {
        name: 'mcpbundles zapsign',
        url: 'https://www.mcpbundles.com/skills/zapsign',
        status: 'third_party',
      },
      {
        name: 'mcpmarket zapsign-signature-manager',
        url: 'https://mcpmarket.com/tools/skills/zapsign-signature-manager',
        status: 'unknown',
      },
    ],
  };
}

async function loadExisting(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const date = process.argv[2] ?? todayIsoDate();
  await mkdir(snapshotsDir, { recursive: true });
  const outPath = path.join(snapshotsDir, `${date}.json`);
  const existing = await loadExisting(outPath);

  const [official, benchmark] = await Promise.all([
    fetchNpmDownloads(OFFICIAL_PKG),
    fetchNpmDownloads(BENCHMARK_PKG),
  ]);

  const snapshot = {
    date,
    geo: 'BR',
    trends: existing?.trends ?? emptyTrends(),
    npm: {
      [OFFICIAL_PKG]: official,
      [BENCHMARK_PKG]: benchmark,
    },
    presence: existing?.presence ?? defaultPresence(),
  };

  await writeFile(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  process.stdout.write(`Wrote ${outPath}\n`);
  process.stdout.write(`Open Trends and fill trends.terms:\n${TRENDS_URL}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
