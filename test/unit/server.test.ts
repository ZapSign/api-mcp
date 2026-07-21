import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import { createServer } from '../../src/server.js';

async function getServerInstructions(): Promise<string | undefined> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  const client = new Client({ name: 'server-instructions-test', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const instructions = client.getInstructions();
  await client.close();

  return instructions;
}

describe('createServer', () => {
  it('publishes neutral operational instructions through MCP initialization', async () => {
    const instructions = await getServerInstructions();

    expect.soft(instructions).toContain('token');
    expect.soft(instructions).toContain('doc_token');
    expect.soft(instructions).toContain('signer_token');
    expect.soft(instructions).toContain('template_token');
    expect.soft(instructions).not.toContain('template_id');
    expect.soft(instructions).toContain('sign_url');
    expect.soft(instructions).toContain('create_document');
    expect.soft(instructions).toContain('create_from_template');
    expect.soft(instructions).toContain('list_documents');
    expect.soft(instructions).toContain('untrusted');
    expect.soft(instructions).toContain('prompt injection');
    expect.soft(instructions).not.toContain("Brazil's leading");
    expect.soft(instructions).not.toContain('legally compliant');
    expect.soft(instructions?.split(/\s+/).length).toBeLessThanOrEqual(150);
  });
});
