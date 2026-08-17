#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_dir="$repo_root/docs/submission/openai-skills/zapsign-mcp-plugin"
output_dir="$repo_root/docs/submission/openai-skills"
output_zip="$output_dir/zapsign-mcp-skills.zip"

mkdir -p \
  "$source_dir/.codex-plugin" \
  "$source_dir/skills/create-signing-request/agents" \
  "$source_dir/skills/create-from-template/agents" \
  "$source_dir/skills/track-signing-status/agents"

if [[ ! -f "$source_dir/.codex-plugin/plugin.json" ]]; then
  echo "Missing plugin manifest: $source_dir/.codex-plugin/plugin.json" >&2
  exit 1
fi

mapfile -t skill_manifests < <(find "$source_dir/skills" -mindepth 2 -maxdepth 2 -name SKILL.md -type f | sort)
if [[ "${#skill_manifests[@]}" -lt 1 ]]; then
  echo "No skills found under $source_dir/skills" >&2
  exit 1
fi

rm -f "$output_zip"

if command -v zip >/dev/null 2>&1; then
  (
    cd "$output_dir"
    zip -q -r "$(basename "$output_zip")" "$(basename "$source_dir")"
  )
else
  windows_source_dir="$source_dir"
  windows_output_dir="$output_dir"
  windows_output_zip="$output_zip"
  if command -v wslpath >/dev/null 2>&1; then
    windows_source_dir="$(wslpath -w "$source_dir")"
    windows_output_dir="$(wslpath -w "$output_dir")"
    windows_output_zip="$(wslpath -w "$output_zip")"
  fi
  powershell.exe -NoProfile -Command \
    "Add-Type -AssemblyName System.IO.Compression; \
    Add-Type -AssemblyName System.IO.Compression.FileSystem; \
    \$archive = [System.IO.Compression.ZipFile]::Open('$windows_output_zip', [System.IO.Compression.ZipArchiveMode]::Create); \
    try { \
      Get-ChildItem -LiteralPath '$windows_source_dir' -Recurse -File | ForEach-Object { \
        \$entryName = \$_.FullName.Substring('$windows_output_dir'.Length + 1).Replace('\', '/'); \
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(\$archive, \$_.FullName, \$entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null \
      } \
    } finally { \$archive.Dispose() }"
fi

echo "Built $output_zip with ${#skill_manifests[@]} skills"
