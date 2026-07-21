import type { ZodError } from 'zod';

import { ZapSignMcpError } from './base.js';

export class ValidationError extends ZapSignMcpError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message, 'validation_error', 400, false);
    this.name = 'ValidationError';
  }

  /** Extracts human-readable field errors from a Zod validation result. */
  static fromZodError(error: ZodError): ValidationError {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      fieldErrors[path] = issue.message;
    }

    const summary = Object.entries(fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ');

    return new ValidationError(`Validation failed — ${summary}`, fieldErrors);
  }
}
