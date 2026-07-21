import { getMcpAuthContext } from 'agents/mcp';

import { DEFAULT_OAUTH_SCOPES, type AuthProps } from './types.js';

const DEFAULT_ZAPSIGN_API_URL = 'https://api.zapsign.com.br';

let stdioAuthProps: AuthProps | null = null;

/**
 * Configures STDIO transport credentials (called by the Node bin entry).
 *
 * @param props - Auth props built from ZAPSIGN_API_KEY / ZAPSIGN_BASE_URL
 */
export function configureStdioAuth(props: AuthProps): void {
  stdioAuthProps = props;
}

/** Clears STDIO credentials (tests / process teardown). */
export function clearStdioAuth(): void {
  stdioAuthProps = null;
}

/**
 * Builds STDIO AuthProps from explicit credentials.
 *
 * @param apiToken - ZapSign API token
 * @param apiUrl - Optional API base URL
 * @returns Auth props with full default scopes
 */
export function buildStdioAuthProps(
  apiToken: string,
  apiUrl?: string | undefined,
): AuthProps {
  const normalizedUrl = apiUrl?.trim();
  return {
    userId: 'stdio',
    zapSignApiUrl:
      normalizedUrl && normalizedUrl.length > 0
        ? normalizedUrl
        : DEFAULT_ZAPSIGN_API_URL,
    zapSignApiToken: apiToken.trim(),
    grantedScope: [...DEFAULT_OAUTH_SCOPES].join(' '),
  };
}

function resolveWorkersAuthProps(): AuthProps | null {
  try {
    const auth = getMcpAuthContext();
    if (!auth?.props) {
      return null;
    }

    // SDK types props as Record; AuthProps is the Workers OAuth contract.
    return auth.props as unknown as AuthProps;
  } catch {
    return null;
  }
}

/**
 * Resolves auth for the active transport.
 * Remote Workers uses OAuth props; STDIO uses configureStdioAuth().
 *
 * @returns Auth props when available, otherwise null
 */
export function getAuthProps(): AuthProps | null {
  const workersAuth = resolveWorkersAuthProps();
  if (workersAuth) {
    return workersAuth;
  }

  return stdioAuthProps;
}
