import { z } from 'zod';
import logger from '../logger.js';

// Common validation schemas
export const CommonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Phone validation (Brazilian format)
  phone: z.string().regex(/^\+55\s?\d{2}\s?\d{4,5}\s?\d{4}$/, 'Invalid phone format. Use +55 format'),

  // CPF validation (Brazilian individual tax ID)
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format. Use XXX.XXX.XXX-XX format'),

  // CNPJ validation (Brazilian company tax ID)
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Invalid CNPJ format. Use XX.XXX.XXX/XXXX-XX format'),

  // Base64 validation
  base64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, 'Invalid base64 format'),

  // URL validation
  url: z.string().url('Invalid URL format'),

  // Date validation (ISO 8601)
  isoDate: z.string().datetime('Invalid date format. Use ISO 8601 format'),

  // Language validation
  language: z.enum(['pt-br', 'en', 'es'], {
    errorMap: () => ({ message: 'Language must be pt-br, en, or es' }),
  }),

  // Boolean validation
  boolean: z.union([z.boolean(), z.enum(['true', 'false'])]).transform(val =>
    typeof val === 'boolean' ? val : val === 'true',
  ),
};

// Document validation schemas
export const DocumentSchemas = {
  // Create document from upload
  createDocumentFromUpload: z.object({
    name: z.string().min(1, 'Document name is required').max(255, 'Document name too long'),
    base64_pdf: CommonSchemas.base64.optional(),
    base64_docx: CommonSchemas.base64.optional(),
    url_pdf: CommonSchemas.url.optional(),
    url_docx: CommonSchemas.url.optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
    send_automatic_email: CommonSchemas.boolean.optional(),
    send_automatic_whatsapp: CommonSchemas.boolean.optional(),
    custom_message: z.string().max(1000).optional(),
    lock_after_sign: CommonSchemas.boolean.optional(),
    disable_sign_after_deadline: CommonSchemas.boolean.optional(),
    deadline: CommonSchemas.isoDate.optional(),
    auto_close: CommonSchemas.boolean.optional(),
    auto_close_after_sign: CommonSchemas.boolean.optional(),
    auto_close_after_deadline: CommonSchemas.boolean.optional(),
    external_id_required: CommonSchemas.boolean.optional(),
    webhook_url: CommonSchemas.url.optional(),
    webhook_headers: z.record(z.string()).optional(),
  }).refine(
    (data) => {
      // Must have either base64 or URL for PDF or DOCX
      const hasPdf = data.base64_pdf || data.url_pdf;
      const hasDocx = data.base64_docx || data.url_docx;
      return hasPdf || hasDocx;
    },
    {
      message: 'Must provide either base64 or URL for PDF or DOCX file',
      path: ['base64_pdf', 'url_pdf', 'base64_docx', 'url_docx'],
    },
  ),

  // Create document from template
  createDocumentFromTemplate: z.object({
    template_id: CommonSchemas.uuid,
    signer_name: z.string().min(1, 'Signer name is required').max(255, 'Signer name too long'),
    send_automatic_email: CommonSchemas.boolean.optional(),
    send_automatic_whatsapp: CommonSchemas.boolean.optional(),
    lang: CommonSchemas.language.optional(),
    external_id: z.string().max(255).optional(),
    data: z.array(z.object({
      de: z.string().min(1, 'Data key is required'),
      para: z.string().min(1, 'Data value is required'),
    })).min(1, 'At least one data item is required'),
  }),

  // Update document
  updateDocument: z.object({
    name: z.string().min(1, 'Document name is required').max(255, 'Document name too long').optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
    send_automatic_email: CommonSchemas.boolean.optional(),
    send_automatic_whatsapp: CommonSchemas.boolean.optional(),
    custom_message: z.string().max(1000).optional(),
    lock_after_sign: CommonSchemas.boolean.optional(),
    disable_sign_after_deadline: CommonSchemas.boolean.optional(),
    deadline: CommonSchemas.isoDate.optional(),
    auto_close: CommonSchemas.boolean.optional(),
    auto_close_after_sign: CommonSchemas.boolean.optional(),
    auto_close_after_deadline: CommonSchemas.boolean.optional(),
    external_id_required: CommonSchemas.boolean.optional(),
    webhook_url: CommonSchemas.url.optional(),
    webhook_headers: z.record(z.string()).optional(),
  }),
};

// Signer validation schemas
export const SignerSchemas = {
  // Add signer
  addSigner: z.object({
    name: z.string().min(1, 'Signer name is required').max(255, 'Signer name too long'),
    email: CommonSchemas.email.optional(),
    phone: CommonSchemas.phone.optional(),
    send_automatic_email: CommonSchemas.boolean.optional(),
    send_automatic_whatsapp: CommonSchemas.boolean.optional(),
    custom_message: z.string().max(1000).optional(),
    lock_after_sign: CommonSchemas.boolean.optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
    deadline: CommonSchemas.isoDate.optional(),
    auto_close: CommonSchemas.boolean.optional(),
    auto_close_after_sign: CommonSchemas.boolean.optional(),
    auto_close_after_deadline: CommonSchemas.boolean.optional(),
    external_id_required: CommonSchemas.boolean.optional(),
    webhook_url: CommonSchemas.url.optional(),
    webhook_headers: z.record(z.string()).optional(),
  }).refine(
    (data) => {
      // Must have either email or phone
      return data.email || data.phone;
    },
    {
      message: 'Must provide either email or phone',
      path: ['email', 'phone'],
    },
  ),

  // Update signer
  updateSigner: z.object({
    name: z.string().min(1, 'Signer name is required').max(255, 'Signer name too long').optional(),
    email: CommonSchemas.email.optional(),
    phone: CommonSchemas.phone.optional(),
    send_automatic_email: CommonSchemas.boolean.optional(),
    send_automatic_whatsapp: CommonSchemas.boolean.optional(),
    custom_message: z.string().max(1000).optional(),
    lock_after_sign: CommonSchemas.boolean.optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
    deadline: CommonSchemas.isoDate.optional(),
    auto_close: CommonSchemas.boolean.optional(),
    auto_close_after_sign: CommonSchemas.boolean.optional(),
    auto_close_after_deadline: CommonSchemas.boolean.optional(),
    external_id_required: CommonSchemas.boolean.optional(),
    webhook_url: CommonSchemas.url.optional(),
    webhook_headers: z.record(z.string()).optional(),
  }),
};

// Template validation schemas
export const TemplateSchemas = {
  // Create template
  createTemplate: z.object({
    name: z.string().min(1, 'Template name is required').max(255, 'Template name too long'),
    base64_docx: CommonSchemas.base64.optional(),
    url_docx: CommonSchemas.url.optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
  }).refine(
    (data) => {
      // Must have either base64 or URL for DOCX
      return data.base64_docx || data.url_docx;
    },
    {
      message: 'Must provide either base64 or URL for DOCX file',
      path: ['base64_docx', 'url_docx'],
    },
  ),

  // Update template
  updateTemplate: z.object({
    name: z.string().min(1, 'Template name is required').max(255, 'Template name too long').optional(),
    external_id: z.string().max(255).optional(),
    lang: CommonSchemas.language.optional(),
  }),
};

// Background check validation schemas
export const BackgroundCheckSchemas = {
  // Person background check
  personBackgroundCheck: z.object({
    name: z.string().min(1, 'Person name is required').max(255, 'Person name too long'),
    cpf: CommonSchemas.cpf,
    birth_date: CommonSchemas.isoDate.optional(),
    mother_name: z.string().max(255).optional(),
    father_name: z.string().max(255).optional(),
    external_id: z.string().max(255).optional(),
  }),

  // Company background check
  companyBackgroundCheck: z.object({
    company_name: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
    cnpj: CommonSchemas.cnpj,
    external_id: z.string().max(255).optional(),
  }),
};

// Webhook validation schemas
export const WebhookSchemas = {
  // Create webhook
  createWebhook: z.object({
    url: CommonSchemas.url,
    events: z.array(z.enum([
      'DOC_EXPIRED',
      'DOC_CREATED',
      'DOC_REMOVED',
      'DOC_SIGNED',
      'DOC_REFUSED',
      'DOC_VIEWED',
      'DOC_EXPIRATION_ALERT',
      'SIGNER_NOTIFICATION',
      'SIGNER_READ_CONFIRMATION',
      'SIGNER_EMAIL_BOUNCE',
      'SIGNER_VALIDATION_FAILED',
      'SIGNER_CREATED',
      'BACKGROUND_CHECK_COMPLETED',
    ])).min(1, 'At least one event must be selected'),
    external_id: z.string().max(255).optional(),
    headers: z.record(z.string()).optional(),
  }),
};

/**
 * Validate input data against a schema
 * @param {Object} schema - Zod schema to validate against
 * @param {Object} data - Data to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validated data
 * @throws {Error} Validation error
 */
export function validateInput (schema, data, context = 'input') {
  try {
    logger.debug(`Validating ${context}`, { data });
    const result = schema.parse(data);
    logger.debug(`${context} validation successful`);
    return result;
  } catch (error) {
    logger.error(`${context} validation failed`, {
      errors: error.errors,
      data: JSON.stringify(data),
    });

    // Create a more user-friendly error message
    const errorMessages = error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`,
    ).join(', ');

    throw new Error(`Validation failed: ${errorMessages}`);
  }
}

/**
 * Validate required fields are present
 * @param {Object} data - Data to check
 * @param {Array<string>} requiredFields - Array of required field names
 * @param {string} context - Context for error messages
 * @throws {Error} If required fields are missing
 */
export function validateRequiredFields (data, requiredFields, context = 'input') {
  const missingFields = requiredFields.filter(field =>
    data[field] === undefined || data[field] === null || data[field] === '',
  );

  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
    logger.error(`${context} validation failed`, { missingFields, data });
    throw new Error(errorMessage);
  }
}

/**
 * Sanitize input data by removing undefined and null values
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeInput (data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}
