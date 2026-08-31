#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_dir="$repo_root/docs/submission/openai-skills/zapsign-mcp-plugin"
skills_dir="$source_dir/skills"
output_dir="$repo_root/docs/submission/openai-skills"
output_zip="$output_dir/zapsign-mcp-skills.zip"

mkdir -p \
  "$skills_dir/create-signing-request/agents" \
  "$skills_dir/create-from-template/agents" \
  "$skills_dir/track-signing-status/agents"

mapfile -t skill_manifests < <(find "$skills_dir" -mindepth 2 -maxdepth 2 -name SKILL.md -type f | sort)
if [[ "${#skill_manifests[@]}" -lt 1 ]]; then
  echo "No skills found under $skills_dir" >&2
  exit 1
fi

rm -f "$output_zip"

if command -v zip >/dev/null 2>&1; then
  (
    cd "$source_dir"
    zip -q -r "$output_zip" "skills"
  )
else
  windows_source_dir="$skills_dir"
  windows_root_dir="$source_dir"
  windows_output_zip="$output_zip"
  if command -v wslpath >/dev/null 2>&1; then
    windows_source_dir="$(wslpath -w "$skills_dir")"
    windows_root_dir="$(wslpath -w "$source_dir")"
    windows_output_zip="$(wslpath -w "$output_zip")"
  fi
  powershell.exe -NoProfile -Command \
    "Add-Type -AssemblyName System.IO.Compression; \
    Add-Type -AssemblyName System.IO.Compression.FileSystem; \
    \$archive = [System.IO.Compression.ZipFile]::Open('$windows_output_zip', [System.IO.Compression.ZipArchiveMode]::Create); \
    try { \
      Get-ChildItem -LiteralPath '$windows_source_dir' -Recurse -File | ForEach-Object { \
        \$entryName = \$_.FullName.Substring('$windows_root_dir'.Length + 1).Replace('\', '/'); \
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(\$archive, \$_.FullName, \$entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null \
      } \
    } finally { \$archive.Dispose() }"
fi

echo "Built $output_zip with ${#skill_manifests[@]} skills"
