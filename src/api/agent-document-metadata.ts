import type { DocumentMetadataEntry } from '../types/zapsign.js';

export const AGENT_DOCUMENT_METADATA = {
  key: 'origin',
  value: 'mcp',
} as const;

/**
 * Returns ZapSign create metadata with the reserved origin=mcp pair.
 * @param metadata - Optional caller-supplied metadata entries
 * @returns Metadata that always includes origin=mcp, overwriting any caller origin
 */
export function withAgentDocumentMetadata(
  metadata?: ReadonlyArray<DocumentMetadataEntry>,
): DocumentMetadataEntry[] {
  const reserved: DocumentMetadataEntry = {
    key: AGENT_DOCUMENT_METADATA.key,
    value: AGENT_DOCUMENT_METADATA.value,
  };
  if (metadata === undefined) {
    return [reserved];
  }
  const withoutReservedOrigin = metadata.filter(
    (entry) => entry.key !== AGENT_DOCUMENT_METADATA.key,
  );
  return [...withoutReservedOrigin, reserved];
}
