# OpenAI plugin skills bundle

This directory contains the source and reproducible ZIP for the skills uploaded to the ZapSign **With MCP** plugin draft.

## Package

- Source root: `zapsign-mcp-plugin/`
- Upload artifact: `zapsign-mcp-skills.zip`
- Build command: `bash scripts/submission/build-openai-skills.sh`

The archive contains one `skills/` directory with three skill roots. Each skill has a required `SKILL.md` and OpenAI-specific MCP dependency metadata in `agents/openai.yaml`; the plugin manifest is intentionally excluded because this is uploaded through the draft's Skills section.

## Included workflows

- `create-signing-request`: create a signing request from a PDF or DOCX source.
- `create-from-template`: inspect exact template variables and create a populated document.
- `track-signing-status`: find a document and summarize signer status.

## Format references

- [Build skills](https://developers.openai.com/plugins/build/skills)
- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Submit plugins](https://developers.openai.com/plugins/deploy/submission)
- [Plugin submission errors](https://developers.openai.com/plugins/deploy/submission-errors)

The bundle contains no credentials, local MCP configuration, scripts, or executable assets. Live access and authorization remain in the production MCP server at `https://mcp.zapsign.com.br/mcp`.
