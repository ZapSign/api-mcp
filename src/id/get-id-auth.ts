import { getMcpAuthContext } from 'agents/mcp';

import type { IdAuthProps } from './types.js';

let stdioIdAuthProps: IdAuthProps | null = null;

/**
 * Configures STDIO transport credentials for the ID bridge (tests/local tooling).
 *
 * @param props - ID auth props
 */
export function configureStdioIdAuth(props: IdAuthProps): void {
  stdioIdAuthProps = props;
}

/** Clears STDIO ID credentials (tests / process teardown). */
export function clearStdioIdAuth(): void {
  stdioIdAuthProps = null;
}

function resolveWorkersIdAuthProps(): IdAuthProps | null {
  try {
    const auth = getMcpAuthContext();
    if (!auth?.props) {
      return null;
    }
    return auth.props as unknown as IdAuthProps;
  } catch {
    return null;
  }
}

/**
 * Resolves ID auth props for the active MCP transport.
 *
 * @returns ID auth props when available, otherwise null
 */
export function getIdAuthProps(): IdAuthProps | null {
  const workersAuth = resolveWorkersIdAuthProps();
  if (workersAuth) {
    return workersAuth;
  }
  return stdioIdAuthProps;
}
