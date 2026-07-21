import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMcpAuthContext } from 'agents/mcp';

import {
  buildStdioAuthProps,
  clearStdioAuth,
  configureStdioAuth,
  getAuthProps,
} from '../../../src/auth/get-auth-props.js';
import { DEFAULT_OAUTH_SCOPES } from '../../../src/auth/types.js';
import { MOCK_AUTH_PROPS } from '../../mocks/zapsign-responses.js';

vi.mock('agents/mcp', () => ({
  getMcpAuthContext: vi.fn(),
}));

const mockAuthContext = getMcpAuthContext as unknown as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.restoreAllMocks();
  clearStdioAuth();
});

describe('getAuthProps', () => {
  it('should prefer Workers OAuth props when present', () => {
    mockAuthContext.mockReturnValue({ props: MOCK_AUTH_PROPS });
    configureStdioAuth(buildStdioAuthProps('stdio-key'));

    expect(getAuthProps()).toEqual(MOCK_AUTH_PROPS);
  });

  it('should fall back to configured STDIO auth with full scopes', () => {
    mockAuthContext.mockReturnValue(null);
    configureStdioAuth(
      buildStdioAuthProps('stdio-key', 'https://sandbox.api.zapsign.com.br'),
    );

    expect(getAuthProps()).toEqual({
      userId: 'stdio',
      zapSignApiUrl: 'https://sandbox.api.zapsign.com.br',
      zapSignApiToken: 'stdio-key',
      grantedScope: [...DEFAULT_OAUTH_SCOPES].join(' '),
    });
  });

  it('should return null when neither transport provides credentials', () => {
    mockAuthContext.mockReturnValue(null);
    clearStdioAuth();
    expect(getAuthProps()).toBeNull();
  });
});
