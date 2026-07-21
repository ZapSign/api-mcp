#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  buildStdioAuthProps,
  configureStdioAuth,
} from '../auth/get-auth-props.js';
import { createServer } from '../server.js';

type NodeProcess = {
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};

function getNodeProcess(): NodeProcess {
  const processRef = (globalThis as { process?: NodeProcess }).process;
  if (!processRef) {
    throw new Error('STDIO entry requires a Node.js process environment');
  }
  return processRef;
}

async function main(): Promise<void> {
  const nodeProcess = getNodeProcess();
  const apiKey = nodeProcess.env.ZAPSIGN_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'Missing ZAPSIGN_API_KEY. Set it in your MCP client env (and optionally ZAPSIGN_BASE_URL).',
    );
    nodeProcess.exit(1);
    return;
  }

  const baseUrl = nodeProcess.env.ZAPSIGN_BASE_URL?.trim();
  const authProps = baseUrl
    ? buildStdioAuthProps(apiKey, baseUrl)
    : buildStdioAuthProps(apiKey);
  configureStdioAuth(authProps);

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown STDIO startup error';
  console.error(message);
  getNodeProcess().exit(1);
});
