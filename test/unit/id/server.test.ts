import { describe, expect, it } from 'vitest';

import { registerIdTools } from '../../../src/id/tools/registry.js';
import { createMockEnv } from './test-helpers.js';

describe('registerIdTools', () => {
  it('should register all seven validation tools', () => {
    const registeredTools: string[] = [];
    const mockServer = {
      registerTool: (name: string) => {
        registeredTools.push(name);
      },
    };

    registerIdTools(mockServer, createMockEnv());
    expect(registeredTools.sort()).toEqual([
      'create_cpf_phone_match_validation',
      'create_liveness_document_match_validation',
      'create_phone_ownership_validation',
      'create_sim_swap_validation',
      'get_validation',
      'list_validations',
      'verify_validation',
    ]);
  });
});
