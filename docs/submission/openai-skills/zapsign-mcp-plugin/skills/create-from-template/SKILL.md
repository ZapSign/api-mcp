---
name: create-from-template
description: Find a ZapSign template, collect its exact dynamic field values, and create an electronic signature document from that template.
---

# Create a document from a template

Use this skill when the user wants to generate a signing request from a reusable ZapSign DOCX template.

## Workflow

1. If the user did not provide a template token, call `list_templates`. Present concise matches and ask the user to select one when the choice is ambiguous.
2. Call `get_template` for the selected token before creation.
3. Read every `inputs[].variable` returned by `get_template`. Build the `data` object with those exact braced strings as keys, such as `{{nome_completo}}`.
4. Ask for the signer name and any missing template values. Do not rename variables, remove braces, or infer business-sensitive values.
5. Enable automatic email or WhatsApp only when the user explicitly requests it and the corresponding contact value is present in the template data.
6. Summarize the chosen template, signer, document name, populated variables, and delivery channels. Ask for confirmation if the user has not already explicitly approved creating that exact document or sending notifications.
7. Call `create_from_template` exactly once. Include `name` only when the user requested a specific document name.
8. Report the returned document token and signing information. If the tool reports that creation succeeded but renaming failed, preserve the returned token and offer to call `update_document` with that token.

## Rules

- Never call `create_from_template` before `get_template` unless the user supplied the exact current variables and explicitly asks to proceed.
- Never invent a template token, field value, signer identity, or contact value.
- Do not silently omit template variables. Explain which values are missing.
- Treat signing links and document tokens as sensitive.
- Do not retry creation after an ambiguous timeout or unexpected error without checking for the created document or asking the user, because creation is not idempotent.
