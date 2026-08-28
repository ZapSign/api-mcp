import { describe, expect, it } from 'vitest';
import { registerAllTools } from '../../../src/tools/registry.js';

type ToolAnnotations = {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

type ToolConfig = {
  title: string;
  description: string;
  annotations: ToolAnnotations;
};

const EXPECTED_TITLES: Record<string, string> = {
  list_documents: 'List Documents',
  get_document: 'Get Document',
  create_document: 'Create Document',
  update_document: 'Update Document',
  delete_document: 'Delete Document',
  place_signatures: 'Place Signatures',
  add_extra_document: 'Add Extra Document',
  add_extra_document_from_template: 'Add Extra Document From Template',
  add_timestamp: 'Add Timestamp',
  reorder_envelope_documents: 'Reorder Envelope Documents',
  add_signer: 'Add Signer',
  get_signer: 'Get Signer',
  update_signer: 'Update Signer',
  delete_signer: 'Delete Signer',
  sign_in_batch: 'Sign In Batch',
  list_templates: 'List Templates',
  get_template: 'Get Template',
  create_from_template: 'Create Document from Template',
  create_webhook: 'Create Webhook',
  delete_webhook: 'Delete Webhook',
  create_webhook_header: 'Create Webhook Header',
  delete_webhook_header: 'Delete Webhook Header',
  reprocess_documents_webhooks: 'Reprocess Documents Webhooks',
  create_partner_account: 'Create Partner Account',
  update_partner_payment_status: 'Update Partner Payment Status',
};

function collectToolConfigs(): Map<string, ToolConfig> {
  const configs = new Map<string, ToolConfig>();
  const server = {
    registerTool: (name: string, config: ToolConfig, _handler: unknown): void => {
      configs.set(name, config);
    },
  };

  registerAllTools(server as never);
  return configs;
}

describe('MCP tool annotations', () => {
  it('should register the full tool union with complete annotations', () => {
    const configs = collectToolConfigs();

    expect([...configs.keys()]).toEqual(Object.keys(EXPECTED_TITLES));
    for (const [name, expectedTitle] of Object.entries(EXPECTED_TITLES)) {
      const config = configs.get(name);
      expect(config).toBeDefined();
      expect(config?.title).toBe(expectedTitle);
      expect(config?.description.length).toBeGreaterThan(20);
      expect(config?.description).not.toMatch(/permanent|resend/i);
      expect(config?.annotations).toEqual({
        title: expectedTitle,
        readOnlyHint: expect.any(Boolean),
        destructiveHint: expect.any(Boolean),
        idempotentHint: expect.any(Boolean),
        openWorldHint: true,
      });
    }
  });

  it('should mark batch signing as destructive', () => {
    const config = collectToolConfigs().get('sign_in_batch');

    expect(config?.annotations.destructiveHint).toBe(true);
  });
});
