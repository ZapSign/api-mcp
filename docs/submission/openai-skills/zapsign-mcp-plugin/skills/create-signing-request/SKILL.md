---
name: create-signing-request
description: Create a ZapSign electronic signature request from a PDF or DOCX source, configure one or more signers, and return the document and signing links.
---

# Create a signing request

Use this skill when the user wants to send a PDF or DOCX for electronic signature without using a ZapSign template.

## Required inputs

Collect:

- A document name.
- Exactly one source: a public HTTP(S) PDF URL, a public HTTP(S) DOCX URL, or raw base64 PDF content without a data URL prefix.
- At least one signer's full name.

Ask only for missing information that is required for the requested behavior. Email is required when automatic email delivery is enabled. `phone_country` without `+` and `phone_number` are required when automatic WhatsApp delivery is enabled.

## Workflow

1. Determine whether the user requested automatic email or WhatsApp delivery. Do not enable either channel by assumption.
2. Build the signer list. Preserve the user's requested order. If signing order is requested, set `signature_order_active` and assign each signer an `order_group`.
3. Before calling `create_document`, summarize the document source, signer names, authentication methods, signing order, and automatic delivery channels. Ask for confirmation if the request will send a notification or create a signing request and the user has not already explicitly approved that exact action.
4. Call `create_document` exactly once with the confirmed values.
5. Report the returned document token and each signing link. State whether ZapSign was instructed to send email or WhatsApp notifications.
6. If the tool returns an authentication error, ask the user to reconnect ZapSign. If validation fails, correct only the invalid input or ask for the missing value; do not invent contact information.

## Rules

- Use `create_from_template` instead when the user wants to fill dynamic fields in a reusable ZapSign template.
- Never provide more than one document source in the same call.
- Never invent signer names, email addresses, phone numbers, tokens, URLs, or authentication methods.
- Treat returned signing links as sensitive. Show them only in the conversation where the user requested the signing workflow.
- Do not retry `create_document` after an ambiguous timeout or unexpected error without checking whether a document was created or asking the user, because creation is not idempotent.
