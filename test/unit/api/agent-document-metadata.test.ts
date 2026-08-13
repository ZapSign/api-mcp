import { describe, expect, it } from 'vitest';

import {
  AGENT_DOCUMENT_METADATA,
  withAgentDocumentMetadata,
} from '../../../src/api/agent-document-metadata.js';

describe('agent document metadata helper', () => {
  it('should return the reserved origin pair', () => {
    expect(withAgentDocumentMetadata()).toEqual([
      { key: 'origin', value: 'mcp' },
    ]);
    expect(AGENT_DOCUMENT_METADATA).toEqual({
      key: 'origin',
      value: 'mcp',
    });
  });
});
