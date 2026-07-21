import { z } from 'zod';

export const PathTokenSchema = z
  .string()
  .min(1)
  .regex(
    /^[A-Za-z0-9-]+$/,
    'Token must contain only letters, numbers, and hyphens.',
  );
