import { z } from 'zod';

import { PathTokenSchema } from '../path-token-schema.js';

export const SignInBatchInputSchema = z.object({
  user_token: PathTokenSchema.describe('User token authorized to sign on behalf of the batch'),
  signer_tokens: z
    .array(PathTokenSchema)
    .min(1)
    .describe('Signer tokens to include in the batch signing request'),
}).strict();
