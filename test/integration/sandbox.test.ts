import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ZapSignClient } from '../../src/api/client.js';
import type { ZapSignDocument, ZapSignSigner, ZapSignTemplate } from '../../src/types/zapsign.js';
import {
  getSandboxPreflightErrors,
  readSandboxIntegrationConfig,
} from './config.js';

const config = readSandboxIntegrationConfig(process.env);
const preflightErrors = getSandboxPreflightErrors(config);
const hasConfiguredIntegration = Boolean(
  config.apiToken || config.apiUrl || config.pdfUrl || config.signerEmail,
);
const integrationReady = hasConfiguredIntegration && preflightErrors.length === 0;
const hasTemplateCredentials = integrationReady && Boolean(config.templateToken);

const TEST_PREFIX = '[MCP-TEST]';

describe.skipIf(!hasConfiguredIntegration)('ZapSign Sandbox Integration preflight', () => {
  it('requires owned sandbox fixtures before sending requests', () => {
    expect(preflightErrors).toEqual([]);
  });
});

describe.skipIf(!integrationReady)('ZapSign Sandbox Integration — CRUD Cycle', () => {
  let client: ZapSignClient;
  const createdDocTokens: string[] = [];

  beforeAll(() => {
    client = new ZapSignClient(config.apiUrl, config.apiToken);
  });

  afterAll(async () => {
    for (const token of createdDocTokens) {
      try {
        await client.deleteDocument(token);
      } catch (error) {
        console.error('sandbox_document_cleanup_failed', error);
      }
    }
  });

  // -- Documents: Create ----------------------------------------------------

  let createdDoc: ZapSignDocument;

  it('creates a document with one signer', async () => {
    const doc = await client.createDocument({
      name: `${TEST_PREFIX} Integration CRUD`,
      url_pdf: config.pdfUrl,
      signers: [{
        name: `${TEST_PREFIX} Signer One`,
        email: config.signerEmail,
        send_automatic_email: config.notificationsEnabled,
      }],
    });

    createdDocTokens.push(doc.token);
    createdDoc = doc;

    expect(doc.token).toBeTruthy();
    expect(doc.name).toBe(`${TEST_PREFIX} Integration CRUD`);
    expect(doc.status).toBe('pending');
    expect(doc.signers.length).toBeGreaterThanOrEqual(1);
  });

  // -- Documents: Read ------------------------------------------------------

  it('retrieves the created document by token', async () => {
    const doc = await client.getDocument(createdDoc.token);

    expect(doc.token).toBe(createdDoc.token);
    expect(doc.name).toBe(`${TEST_PREFIX} Integration CRUD`);
    expect(doc.original_file).toBeTruthy();
    expect(Array.isArray(doc.signers)).toBe(true);
    expect(doc.signers.length).toBeGreaterThanOrEqual(1);
  });

  it('lists documents and finds the created one', async () => {
    const list = await client.listDocuments({ page: 1 });

    expect(typeof list.count).toBe('number');
    expect(Array.isArray(list.results)).toBe(true);
    expect(list.count).toBeGreaterThanOrEqual(1);

    const found = list.results.find((d) => d.token === createdDoc.token);
    expect(found).toBeDefined();
  });

  // -- Documents: Update ----------------------------------------------------

  it('updates document metadata with PUT and refetches the result', async () => {
    await client.updateDocument(createdDoc.token, {
      name: `${TEST_PREFIX} Updated CRUD`,
    });

    const updated = await client.getDocument(createdDoc.token);
    expect(updated.name).toBe(`${TEST_PREFIX} Updated CRUD`);
  });

  // -- Signers: Add + Read --------------------------------------------------

  let addedSigner: ZapSignSigner;

  it('adds a second signer to the document', async () => {
    const signer = await client.addSigner(createdDoc.token, {
      name: `${TEST_PREFIX} Signer Two`,
      send_automatic_email: false,
    });

    addedSigner = signer;

    expect(signer.token).toBeTruthy();
    expect(signer.name).toBe(`${TEST_PREFIX} Signer Two`);
    expect(signer.sign_url).toBeTruthy();
  });

  it('retrieves the added signer by token', async () => {
    const signer = await client.getSigner(addedSigner.token);

    expect(signer.token).toBe(addedSigner.token);
    expect(signer.name).toBe(`${TEST_PREFIX} Signer Two`);
    expect(signer.status).toBeTruthy();
  });

  // -- Signers: Update + Delete ---------------------------------------------

  it('updates the added signer', async () => {
    const updated = await client.updateSigner(addedSigner.token, {
      name: `${TEST_PREFIX} Signer Two Updated`,
    });

    expect(updated.name).toBe(`${TEST_PREFIX} Signer Two Updated`);
  });

  it('deletes the added signer', async () => {
    await client.deleteSigner(addedSigner.token);

    const document = await client.getDocument(createdDoc.token);
    expect(document.signers).not.toContainEqual(
      expect.objectContaining({ token: addedSigner.token }),
    );
  });

  it('lists templates without error', async () => {
    const list = await client.listTemplates({ page: 1 });

    expect(typeof list.count).toBe('number');
    expect(Array.isArray(list.results)).toBe(true);
  });

  it('deletes the test document', async () => {
    const result = await client.deleteDocument(createdDoc.token);
    expect(result).toBeDefined();

    const idx = createdDocTokens.indexOf(createdDoc.token);
    if (idx >= 0) {
      createdDocTokens.splice(idx, 1);
    }
  });
});

const TEMPLATE_TEST_DATA: Record<string, string> = {
  '{{CONTRACT DATE}}': 'March 7, 2026',
  '{{CONTRACT SUBJECT}}': 'Software Development and Integration Services',
  '{{START DATE}}': 'April 1, 2026',
  '{{END DATE}}': 'March 31, 2027',
  '{{PAYMENT AMOUNT}}': '12,000.00',
  '{{CURRENCY}}': 'USD',
  '{{PAYMENT METHOD}}': 'Bank Wire Transfer',
  '{{PARTY A RESPONSIBILITIES}}': 'Provide technical requirements, API credentials, and timely feedback on deliverables',
  '{{PARTY B RESPONSIBILITIES}}': 'Design, develop, test, and deploy software integrations per agreed specifications',
  '{{NOTICE PERIOD}}': '30 days',
  '{{JURISDICTION}}': 'State of Delaware, United States',
  '{{ADDITIONAL NOTES}}': 'This agreement may be renewed upon mutual written consent',
  '{{PARTY A NAME}}': 'MCP Sandbox Party A',
  '{{PARTY A EMAIL}}': 'mcp-party-a@example.test',
  '{{PARTY A ID}}': 'MCP-SANDBOX-A',
  '{{PARTY B NAME}}': 'MCP Sandbox Party B',
  '{{PARTY B EMAIL}}': 'mcp-party-b@example.test',
  '{{PARTY B ID}}': 'MCP-SANDBOX-B',
  '{{SIGNER SIGNATURE}}': '(to be signed digitally)',
  '{{SIGNER NAME}}': 'MCP Sandbox Signer',
  '{{SIGNER EMAIL}}': 'mcp-signer@example.test',
  '{{SIGNATURE DATE}}': 'March 7, 2026',
};

describe.skipIf(!hasTemplateCredentials)('ZapSign Sandbox Integration — Template to Document', () => {
  let client: ZapSignClient;
  const createdDocTokens: string[] = [];

  beforeAll(() => {
    client = new ZapSignClient(config.apiUrl, config.apiToken);
  });

  afterAll(async () => {
    for (const token of createdDocTokens) {
      try {
        await client.deleteDocument(token);
      } catch (error) {
        console.error('sandbox_template_cleanup_failed', error);
      }
    }
  });

  // -- Templates: List & Verify ---------------------------------------------

  it('lists templates and finds the known test template', async () => {
    const list = await client.listTemplates({ page: 1 });

    expect(list.count).toBeGreaterThanOrEqual(1);
    const found = list.results.find((t) => t.token === config.templateToken);
    expect(found).toBeDefined();
    expect(found!.active).toBe(true);
  });

  // -- Templates: Get Details -----------------------------------------------

  let template: ZapSignTemplate;

  it('retrieves template details with input variables', async () => {
    template = await client.getTemplate(config.templateToken);

    expect(template.token).toBe(config.templateToken);
    expect(template.active).toBe(true);
    expect(Array.isArray(template.inputs)).toBe(true);
    expect(template.inputs.length).toBeGreaterThan(0);
  });

  // -- Templates: Create Document -------------------------------------------

  let templateDoc: ZapSignDocument;

  it('creates a document from the template with all variables filled', async () => {
    const dataFromInputs: Record<string, string> = {};
    for (const input of template.inputs) {
      const testValue = TEMPLATE_TEST_DATA[input.variable];
      dataFromInputs[input.variable] = testValue ?? `[test] ${input.variable}`;
    }

    const doc = await client.createFromTemplate({
      template_token: config.templateToken,
      signer_name: 'MCP Sandbox Signer',
      signer_email: config.signerEmail,
      data: dataFromInputs,
      send_automatic_email: config.notificationsEnabled,
    });

    createdDocTokens.push(doc.token);
    templateDoc = doc;

    expect(doc.token).toBeTruthy();
    expect(doc.status).toBe('pending');
    expect(doc.signers.length).toBeGreaterThanOrEqual(1);
    expect(doc.original_file).toBeTruthy();
  });

  it('retrieves the template-created document and verifies signers', async () => {
    const doc = await client.getDocument(templateDoc.token);

    expect(doc.token).toBe(templateDoc.token);
    expect(doc.signers.length).toBeGreaterThanOrEqual(1);

    const signer = doc.signers[0];
    expect(signer.name).toBe('MCP Sandbox Signer');
    expect(signer.sign_url).toBeTruthy();
  });
});
