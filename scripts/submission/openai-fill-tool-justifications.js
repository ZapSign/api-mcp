/**
 * OpenAI Apps Directory — fill the 75 per-tool annotation justification fields.
 *
 * Paste into the browser console while the plugin draft is open on the MCP section:
 * https://platform.openai.com/plugins/edit/asdk_app_6a7f4a126ab88191a83a67cf744ca7da/asdk_app_v_6a7f4a136fb08191abc40efc7e45c499?section=MCP%20Server
 *
 * Text mirrors docs/submission/openai-tool-annotations.md, which is derived from the
 * annotations declared in src/tools/**. Returns {filled, missing} — expect filled = 75.
 */
const TOOL_JUSTIFICATIONS = {
  list_documents: {
    read_only_justification:
      'list_documents only issues a GET to the ZapSign documents endpoint and returns a paginated list. It requires the documents:read scope and has no code path that creates, updates, or deletes data.',
    open_world_justification:
      "Results are fetched live from the customer's ZapSign account over the public internet (api.zapsign.com.br), so the data is external and can change between calls.",
    destructive_justification:
      'The call performs no writes at all, so no document, signer, or signing state can be removed or overwritten.',
  },
  get_document: {
    read_only_justification:
      'get_document performs a single GET by doc_token under the documents:read scope and returns document details plus signer status; the handler contains no write path.',
    open_world_justification:
      'Document data is fetched live from the external ZapSign API and reflects real account state that other users and signers can change.',
    destructive_justification:
      'Retrieval only; the document, its signers, and its signing progress are left untouched.',
  },
  create_document: {
    read_only_justification:
      'create_document writes: it creates a new signature document from url_pdf, url_docx, or base64_pdf and requires the documents:write scope.',
    open_world_justification:
      "The document is created in the customer's external ZapSign account and can trigger real email or WhatsApp delivery to third-party signers.",
    destructive_justification:
      'It only adds a new document; no existing document, signer, or template is modified or deleted.',
  },
  update_document: {
    read_only_justification:
      'update_document writes: it applies a partial update (name, signing deadline, folder, extra-document names) to an existing document under documents:write.',
    open_world_justification:
      'The update is applied to live data in the external ZapSign account, whose current state is not known to the model in advance.',
    destructive_justification:
      'It edits metadata in place and never deletes the document or its signers, so no data is destroyed.',
  },
  delete_document: {
    read_only_justification:
      'delete_document writes: it calls the ZapSign delete endpoint for the given doc_token and requires documents:write.',
    open_world_justification:
      "The deletion targets real records in the external ZapSign platform, and ZapSign may reject it depending on the document's live state.",
    destructive_justification:
      'It permanently removes a document from the customer account, ending its availability in the signing workflow, and the app cannot undo it.',
  },
  place_signatures: {
    read_only_justification:
      'place_signatures writes: it stores positioned signature fields (rubricas) on an existing document under documents:write.',
    open_world_justification:
      "Placements are applied to a live document in the external ZapSign account and depend on that document's current pages and signers.",
    destructive_justification:
      'It only adds signature placements; existing document content and signer records are preserved.',
  },
  add_extra_document: {
    read_only_justification:
      'add_extra_document writes: it uploads an additional PDF attachment to an existing signing package under documents:write.',
    open_world_justification:
      'The upload targets an external ZapSign document and normally fetches the file from a public URL on the open internet.',
    destructive_justification:
      'The main document and previously attached files are kept; the call only adds a new attachment.',
  },
  add_extra_document_from_template: {
    read_only_justification:
      'This tool writes: it renders a template into a new extra document attached to a parent document, and requires documents:write plus templates:write.',
    open_world_justification:
      "Both the template and the parent document live in the customer's external ZapSign account and can change independently.",
    destructive_justification:
      'The parent document and the source template are unchanged; only a new generated attachment is added.',
  },
  add_timestamp: {
    read_only_justification:
      'add_timestamp writes: it applies a cryptographic timestamp to the document, changing the stored artifact, and requires documents:write.',
    open_world_justification:
      'The operation runs against the external ZapSign service and a document reachable at a public URL, and depends on a third-party trusted time source.',
    destructive_justification:
      'Timestamping only augments the audit evidence of the document; no content, signature, or signer is removed.',
  },
  reorder_envelope_documents: {
    read_only_justification:
      'This tool writes: it persists a new display order for the documents inside an envelope under documents:write.',
    open_world_justification:
      "The envelope and its member documents are live objects in the customer's external ZapSign account.",
    destructive_justification:
      'Reordering rearranges references only; no document is deleted and no signature data is lost.',
  },
  add_signer: {
    read_only_justification:
      'add_signer writes: it adds a signer to an existing document and returns a new signer token and signing link, requiring signers:write.',
    open_world_justification:
      'The signer is created in the external ZapSign account and the invitation is delivered to a real third-party recipient by email or WhatsApp.',
    destructive_justification:
      'Existing signers and the document itself are preserved; the call only appends a participant.',
  },
  get_signer: {
    read_only_justification:
      "get_signer only reads a single signer's status, authentication mode, view count, and optional geolocation under signers:read.",
    open_world_justification:
      'Signer status is owned by the external ZapSign platform and changes whenever the real person views or signs the document.',
    destructive_justification:
      'Pure retrieval; the signer record and the signing workflow are unaffected.',
  },
  update_signer: {
    read_only_justification:
      "update_signer writes: it updates a signer's name, email, or phone before signing and requires signers:write.",
    open_world_justification:
      'The change is applied to a live signer in the external ZapSign account, and ZapSign rejects it once that person has already signed.',
    destructive_justification:
      'The signer record is edited in place and stays attached to the document; nothing is removed.',
  },
  delete_signer: {
    read_only_justification:
      'delete_signer writes: it removes a signer from a document by signer_token under signers:write.',
    open_world_justification:
      "The removal affects a real participant in the customer's external ZapSign account and depends on that document's live signing state.",
    destructive_justification:
      'It detaches the signer and invalidates their pending signing link, which this app cannot reverse.',
  },
  sign_in_batch: {
    read_only_justification:
      'sign_in_batch writes: it executes signatures for multiple documents in a single request under signers:write.',
    open_world_justification:
      'Signatures are registered on the external ZapSign platform and are legally meaningful actions on real documents.',
    destructive_justification:
      'Signing advances the workflow and adds signatures; it deletes no documents and no signer records.',
  },
  list_templates: {
    read_only_justification:
      "list_templates only issues a paginated GET of the account's templates under templates:read; the handler has no write path.",
    open_world_justification:
      "Templates are stored in the customer's external ZapSign account and can be edited there at any time.",
    destructive_justification: 'Retrieval only; no template is created, edited, or deleted.',
  },
  get_template: {
    read_only_justification:
      'get_template only reads one template and its dynamic fields under templates:read so the correct variables can be filled later.',
    open_world_justification:
      'The template definition lives in the external ZapSign account and may differ from anything cached in the conversation.',
    destructive_justification: 'Inspection only; the template definition is not modified.',
  },
  create_from_template: {
    read_only_justification:
      'create_from_template writes: it renders a DOCX template into a new signature document with the supplied dynamic-field values and requires templates:write.',
    open_world_justification:
      'The document is created in the external ZapSign account and can trigger real email or WhatsApp delivery to signers.',
    destructive_justification:
      'The source template is untouched and no existing document is replaced; only a new document is produced.',
  },
  create_webhook: {
    read_only_justification:
      'create_webhook writes: it registers a company webhook endpoint for ZapSign event notifications under webhooks:write.',
    open_world_justification:
      'The subscription lives in the external ZapSign account and causes future deliveries to an arbitrary third-party HTTPS URL.',
    destructive_justification:
      'Existing webhooks keep working; the call only adds a new subscription.',
  },
  delete_webhook: {
    read_only_justification:
      'delete_webhook writes: it deletes a company webhook by numeric ID under webhooks:write.',
    open_world_justification:
      'The webhook is configuration inside the external ZapSign account and governs traffic to a third-party endpoint.',
    destructive_justification:
      'Removing the subscription permanently stops event delivery to that URL and can silently break downstream integrations.',
  },
  create_webhook_header: {
    read_only_justification:
      'create_webhook_header writes: it attaches custom HTTP headers to an existing webhook under webhooks:write.',
    open_world_justification:
      'Headers are stored in the external ZapSign account and are sent on future deliveries to a third-party endpoint.',
    destructive_justification:
      'Previously configured headers and the webhook itself are preserved; the call only adds entries.',
  },
  delete_webhook_header: {
    read_only_justification:
      'delete_webhook_header writes: it deletes a webhook header by numeric ID under webhooks:write.',
    open_world_justification:
      'The change applies to live webhook configuration in the external ZapSign account.',
    destructive_justification:
      'The header is permanently removed, which can break authentication on the receiving endpoint if it carried a credential.',
  },
  reprocess_documents_webhooks: {
    read_only_justification:
      'This tool writes: it triggers redelivery of webhook events for a document under webhooks:write, which is an action rather than a query.',
    open_world_justification:
      "Redelivery is executed by the external ZapSign platform toward third-party endpoints outside this app's control.",
    destructive_justification:
      'No configuration or document data is deleted; only previously emitted events are dispatched again.',
  },
  create_partner_account: {
    read_only_justification:
      'create_partner_account writes: it provisions a new partner company account and requires the partner:write scope plus partner privileges on the ZapSign token.',
    open_world_justification:
      'Provisioning happens in the external ZapSign platform; non-partner tokens receive an actionable privilege error from the live API.',
    destructive_justification:
      'It creates a new account record; no existing partner, company, or document is modified or removed.',
  },
  update_partner_payment_status: {
    read_only_justification:
      'update_partner_payment_status writes: it sets a new payment status on a partner account under partner:write.',
    open_world_justification:
      "Billing state is owned by the external ZapSign platform and affects a real partner company's service level.",
    destructive_justification:
      "It overwrites live billing state and can suspend or re-enable a partner company's access, so it is flagged as destructive and requires explicit confirmation.",
  },
};

(() => {
  const setValue = (element, value) => {
    const prototype =
      element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  let filled = 0;
  const missing = [];
  for (const tool of Object.keys(TOOL_JUSTIFICATIONS)) {
    for (const field of Object.keys(TOOL_JUSTIFICATIONS[tool])) {
      const name = `version.tool_justifications.${tool}.${field}`;
      const element = document.querySelector(`[name="${name}"]`);
      if (!element) {
        missing.push(name);
        continue;
      }
      setValue(element, TOOL_JUSTIFICATIONS[tool][field]);
      filled += 1;
    }
  }
  return { filled, missing };
})();
