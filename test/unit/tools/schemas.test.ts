import { describe, it, expect } from 'vitest';

import {
  ListDocumentsInputSchema,
  GetDocumentInputSchema,
  CreateDocumentInputSchema,
  UpdateDocumentInputSchema,
  DeleteDocumentInputSchema,
  CreateSignerInputSchema,
} from '../../../src/tools/documents/schemas.js';
import {
  AddSignerInputSchema,
  GetSignerInputSchema,
  UpdateSignerInputSchema,
  DeleteSignerInputSchema,
} from '../../../src/tools/signers/schemas.js';
import {
  ListTemplatesInputSchema,
  GetTemplateInputSchema,
  CreateFromTemplateInputSchema,
} from '../../../src/tools/templates/schemas.js';
import {
  AuthMode,
  type CreateSignerInput,
  type ZapSignSigner,
  type ZapSignTemplateSigner,
} from '../../../src/types/zapsign.js';

const ADDITIONAL_AUTH_MODES = [
  'assinaturaTela-tokenEmail',
  'assinaturaTela-tokenSms',
  'tokenWhatsapp',
  'assinaturaTela-tokenWhatsapp',
];

const AUTH_MODE_DESCRIPTION = 'Signer authentication method: assinaturaTela (draw signature on screen), tokenEmail (email OTP code), assinaturaTela-tokenEmail (screen signature and email OTP), tokenSms (SMS OTP code), assinaturaTela-tokenSms (screen signature and SMS OTP), tokenWhatsapp (WhatsApp OTP code), assinaturaTela-tokenWhatsapp (screen signature and WhatsApp OTP)';
// ---------------------------------------------------------------------------
// Document schemas
// ---------------------------------------------------------------------------

describe('ListDocumentsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = ListDocumentsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid status enum value', () => {
    const result = ListDocumentsInputSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status value', () => {
    const result = ListDocumentsInputSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should accept valid sort_order values', () => {
    expect(ListDocumentsInputSchema.safeParse({ sort_order: 'asc' }).success).toBe(true);
    expect(ListDocumentsInputSchema.safeParse({ sort_order: 'desc' }).success).toBe(true);
  });

  it('should reject page < 1', () => {
    const result = ListDocumentsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date filters', () => {
    const result = ListDocumentsInputSchema.safeParse({ created_from: '2026-02-30' });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer page', () => {
    const result = ListDocumentsInputSchema.safeParse({ page: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('GetDocumentInputSchema', () => {
  it('should accept valid doc_token', () => {
    const result = GetDocumentInputSchema.safeParse({ doc_token: 'abc-123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty doc_token', () => {
    const result = GetDocumentInputSchema.safeParse({ doc_token: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing doc_token', () => {
    const result = GetDocumentInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('CreateDocumentInputSchema', () => {
  const validBase = {
    name: 'Test Contract',
    signers: [{ name: 'John Doe' }],
  };

  it('should accept document with url_pdf', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      url_pdf: 'https://example.com/doc.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept document with base64_pdf', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      base64_pdf: 'JVBERi0xLjQK',
    });
    expect(result.success).toBe(true);
  });

  it('should reject document without url_pdf or base64_pdf', () => {
    const result = CreateDocumentInputSchema.safeParse(validBase);
    expect(result.success).toBe(false);
  });

  it('should reject document with both url_pdf and base64_pdf', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      url_pdf: 'https://example.com/doc.pdf',
      base64_pdf: 'JVBERi0xLjQK',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a non-HTTP PDF URL', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      url_pdf: 'ftp://example.com/doc.pdf',
    });
    expect(result.success).toBe(false);
  });

  it('should reject base64 that is not a PDF payload', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      base64_pdf: 'aGVsbG8=',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty signers array', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: '',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer' }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject signer with invalid email', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', email: 'not-an-email' }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept signer with valid auth_mode', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', auth_mode: 'assinaturaTela' }],
    });
    expect(result.success).toBe(true);
  });

  it('should accept every documented combined auth_mode', () => {
    for (const authMode of ADDITIONAL_AUTH_MODES) {
      const result = CreateDocumentInputSchema.safeParse({
        name: 'Test',
        url_pdf: 'https://example.com/doc.pdf',
        signers: [{ name: 'Signer', auth_mode: authMode }],
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject signer with invalid auth_mode', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', auth_mode: 'invalid_mode' }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept signer with WhatsApp and messaging fields', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{
        name: 'Signer',
        phone_country: '55',
        phone_number: '11999887766',
        send_automatic_whatsapp: true,
        custom_message: 'Please sign this contract',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('should require an email when automatic email is enabled', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', send_automatic_email: true }],
    });
    expect(result.success).toBe(false);
  });

  it('should require both phone fields when automatic WhatsApp is enabled', () => {
    const result = CreateDocumentInputSchema.safeParse({
      ...validBase,
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', send_automatic_whatsapp: true }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept signer with redirect, qualification, and external_id', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{
        name: 'Signer',
        redirect_link: 'https://myapp.com/thank-you',
        qualification: 'Witness',
        external_id: 'user-123',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject signer with invalid redirect_link URL', () => {
    const result = CreateDocumentInputSchema.safeParse({
      name: 'Test',
      url_pdf: 'https://example.com/doc.pdf',
      signers: [{ name: 'Signer', redirect_link: 'not-a-url' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateDocumentInputSchema', () => {
  it('should accept every documented update field', () => {
    const result = UpdateDocumentInputSchema.safeParse({
      doc_token: 'abc-123',
      name: 'Updated Name',
      date_limit_to_sign: '2026-12-31',
      folder_path: '/contracts/2026/',
      folder_token: 'folder-123',
      extra_docs: [{ token: 'extra-123', name: 'Renamed attachment' }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject an update without a documented field', () => {
    const result = UpdateDocumentInputSchema.safeParse({ doc_token: 'abc-123' });
    expect(result.success).toBe(false);
  });

  it('should reject empty doc_token', () => {
    const result = UpdateDocumentInputSchema.safeParse({ doc_token: '' });
    expect(result.success).toBe(false);
  });

  it('should reject undocumented update fields', () => {
    const result = UpdateDocumentInputSchema.safeParse({
      doc_token: 'abc-123',
      lang: 'en',
      external_id: 'external-123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject an invalid signing deadline date', () => {
    const result = UpdateDocumentInputSchema.safeParse({
      doc_token: 'abc-123',
      date_limit_to_sign: '2026-02-30',
    });
    expect(result.success).toBe(false);
  });
});

describe('DeleteDocumentInputSchema', () => {
  it('should accept valid doc_token', () => {
    const result = DeleteDocumentInputSchema.safeParse({ doc_token: 'abc-123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty doc_token', () => {
    const result = DeleteDocumentInputSchema.safeParse({ doc_token: '' });
    expect(result.success).toBe(false);
  });
});

describe('CreateSignerInputSchema', () => {
  it('should use synthetic Brazilian phone examples in descriptions', () => {
    expect(CreateSignerInputSchema.shape.phone_country.description).toBe('Phone country code without + prefix (e.g. 55 for Brazil)');
    expect(CreateSignerInputSchema.shape.phone_number.description).toBe('Phone number with area code, without country code (e.g. 11999887766)');
  });

  it('should accept minimal signer (name only)', () => {
    const result = CreateSignerInputSchema.safeParse({ name: 'John Doe' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CreateSignerInputSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should accept all optional fields', () => {
    const result = CreateSignerInputSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      phone_country: '55',
      phone_number: '11999887766',
      send_automatic_email: true,
      auth_mode: 'tokenEmail',
      order_group: 1,
      lock_name: true,
      lock_email: false,
      lock_phone: false,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Signer schemas
// ---------------------------------------------------------------------------

describe('AddSignerInputSchema', () => {
  it('should accept every documented combined auth_mode', () => {
    for (const authMode of ADDITIONAL_AUTH_MODES) {
      const result = AddSignerInputSchema.safeParse({
        doc_token: 'd',
        name: 'N',
        auth_mode: authMode,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should represent every documented combined auth_mode in request and response types', () => {
    const requestAuthModes: NonNullable<CreateSignerInput['auth_mode']>[] = [
      AuthMode.ScreenSignatureAndEmailToken,
      AuthMode.ScreenSignatureAndSmsToken,
      AuthMode.WhatsappToken,
      AuthMode.ScreenSignatureAndWhatsappToken,
    ];
    const signerResponseAuthModes: ZapSignSigner['auth_mode'][] = [
      AuthMode.ScreenSignatureAndEmailToken,
      AuthMode.ScreenSignatureAndSmsToken,
      AuthMode.WhatsappToken,
      AuthMode.ScreenSignatureAndWhatsappToken,
    ];
    const templateResponseAuthModes: ZapSignTemplateSigner['auth_mode'][] = [
      AuthMode.ScreenSignatureAndEmailToken,
      AuthMode.ScreenSignatureAndSmsToken,
      AuthMode.WhatsappToken,
      AuthMode.ScreenSignatureAndWhatsappToken,
    ];

    expect(requestAuthModes).toEqual(ADDITIONAL_AUTH_MODES);
    expect(signerResponseAuthModes).toEqual(ADDITIONAL_AUTH_MODES);
    expect(templateResponseAuthModes).toEqual(ADDITIONAL_AUTH_MODES);
  });

  it('should use the same complete auth_mode description as document signers', () => {
    expect(CreateSignerInputSchema.shape.auth_mode.description).toBe(AUTH_MODE_DESCRIPTION);
    expect(AddSignerInputSchema._def.schema.shape.auth_mode.description).toBe(AUTH_MODE_DESCRIPTION);
  });

  it('should use synthetic Brazilian phone examples in descriptions', () => {
    expect(AddSignerInputSchema._def.schema.shape.phone_country.description).toBe('Phone country code without + prefix (e.g. 55 for Brazil)');
    expect(AddSignerInputSchema._def.schema.shape.phone_number.description).toBe('Phone number with area code, without country code (e.g. 11999887766)');
  });

  it('should accept valid input with doc_token and name', () => {
    const result = AddSignerInputSchema.safeParse({ doc_token: 'doc-123', name: 'Maria' });
    expect(result.success).toBe(true);
  });

  it('should reject missing doc_token', () => {
    const result = AddSignerInputSchema.safeParse({ name: 'Maria' });
    expect(result.success).toBe(false);
  });

  it('should reject missing name', () => {
    const result = AddSignerInputSchema.safeParse({ doc_token: 'doc-123' });
    expect(result.success).toBe(false);
  });

  it('should accept valid auth_mode enum values', () => {
    expect(AddSignerInputSchema.safeParse({ doc_token: 'd', name: 'N', auth_mode: 'assinaturaTela' }).success).toBe(true);
    expect(AddSignerInputSchema.safeParse({ doc_token: 'd', name: 'N', auth_mode: 'tokenEmail' }).success).toBe(true);
    expect(AddSignerInputSchema.safeParse({ doc_token: 'd', name: 'N', auth_mode: 'tokenSms' }).success).toBe(true);
  });

  it('should reject invalid auth_mode', () => {
    const result = AddSignerInputSchema.safeParse({ doc_token: 'd', name: 'N', auth_mode: 'fax' });
    expect(result.success).toBe(false);
  });

  it('should accept WhatsApp, messaging, and redirect fields', () => {
    const result = AddSignerInputSchema.safeParse({
      doc_token: 'doc-123',
      name: 'Maria',
      phone_country: '55',
      phone_number: '11999887766',
      send_automatic_whatsapp: true,
      custom_message: 'Please sign',
      redirect_link: 'https://myapp.com/done',
      qualification: 'Contractor',
      external_id: 'ext-456',
      lock_name: true,
      lock_email: false,
      lock_phone: true,
    });
    expect(result.success).toBe(true);
  });

  it('should require an email for automatic email notifications', () => {
    const result = AddSignerInputSchema.safeParse({
      doc_token: 'doc-123',
      name: 'Maria',
      send_automatic_email: true,
    });
    expect(result.success).toBe(false);
  });

  it('should require both phone fields for automatic WhatsApp notifications', () => {
    const result = AddSignerInputSchema.safeParse({
      doc_token: 'doc-123',
      name: 'Maria',
      send_automatic_whatsapp: true,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid redirect_link URL', () => {
    const result = AddSignerInputSchema.safeParse({
      doc_token: 'doc-123',
      name: 'Maria',
      redirect_link: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('GetSignerInputSchema', () => {
  it('should accept valid signer_token', () => {
    const result = GetSignerInputSchema.safeParse({ signer_token: 'sig-123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty signer_token', () => {
    const result = GetSignerInputSchema.safeParse({ signer_token: '' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateSignerInputSchema', () => {
  it('should accept signer_token with optional fields', () => {
    const result = UpdateSignerInputSchema.safeParse({
      signer_token: 'sig-123',
      name: 'Updated Name',
      email: 'new@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject signer_token alone', () => {
    const result = UpdateSignerInputSchema.safeParse({ signer_token: 'sig-123' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = UpdateSignerInputSchema.safeParse({
      signer_token: 'sig-123',
      email: 'not-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('DeleteSignerInputSchema', () => {
  it('should accept valid signer_token', () => {
    const result = DeleteSignerInputSchema.safeParse({ signer_token: 'sig-123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty signer_token', () => {
    const result = DeleteSignerInputSchema.safeParse({ signer_token: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Template schemas
// ---------------------------------------------------------------------------

describe('ListTemplatesInputSchema', () => {
  it('should accept empty object (page defaults to 1)', () => {
    const result = ListTemplatesInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid page number', () => {
    const result = ListTemplatesInputSchema.safeParse({ page: 3 });
    expect(result.success).toBe(true);
  });

  it('should reject page < 1', () => {
    const result = ListTemplatesInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('GetTemplateInputSchema', () => {
  it('should accept valid template_token', () => {
    const result = GetTemplateInputSchema.safeParse({ template_token: 'tpl-123' });
    expect(result.success).toBe(true);
  });

  it('should describe template_token as the token from a list_templates result', () => {
    const description = GetTemplateInputSchema.shape.template_token.description;

    expect(description).toContain('list_templates');
    expect(description).toContain('results[].token');
  });

  it('should reject empty template_token', () => {
    const result = GetTemplateInputSchema.safeParse({ template_token: '' });
    expect(result.success).toBe(false);
  });
});

describe('CreateFromTemplateInputSchema', () => {
  const validInput = {
    template_token: 'tpl-123',
    signer_name: 'John Doe',
    data: { '{{nome}}': 'John' },
  };

  it('should describe template_token as the token from a list_templates result', () => {
    const description = CreateFromTemplateInputSchema.shape.template_token.description;

    expect(description).toContain('list_templates');
    expect(description).toContain('results[].token');
    expect(description).toContain('template_id');
  });

  it('should describe data keys as exact braced template input variables', () => {
    const description = CreateFromTemplateInputSchema.shape.data.description;

    expect(description).toContain('get_template');
    expect(description).toContain('exact braced strings');
    expect(description).toContain('inputs[].variable');
    expect(description).toContain('{{nome_completo}}');
  });

  it('should accept valid input', () => {
    const result = CreateFromTemplateInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject template_id instead of the canonical template_token', () => {
    const { template_token: _, ...rest } = validInput;
    const result = CreateFromTemplateInputSchema.safeParse({
      ...rest,
      template_id: 'tpl-123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing template_token', () => {
    const { template_token: _, ...rest } = validInput;
    const result = CreateFromTemplateInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('should reject missing signer_name', () => {
    const { signer_name: _, ...rest } = validInput;
    const result = CreateFromTemplateInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('should reject missing data', () => {
    const { data: _, ...rest } = validInput;
    const result = CreateFromTemplateInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('should reject unsupported signer_email input', () => {
    const result = CreateFromTemplateInputSchema.safeParse({
      ...validInput,
      signer_email: 'john@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('should accept empty data map', () => {
    const result = CreateFromTemplateInputSchema.safeParse({
      ...validInput,
      data: {},
    });
    expect(result.success).toBe(true);
  });

  it('should accept send_automatic_email as true', () => {
    const result = CreateFromTemplateInputSchema.safeParse({
      ...validInput,
      send_automatic_email: true,
    });
    expect(result.success).toBe(true);
  });

  it('should accept send_automatic_whatsapp as true', () => {
    const result = CreateFromTemplateInputSchema.safeParse({
      ...validInput,
      send_automatic_whatsapp: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean send_automatic_email', () => {
    const result = CreateFromTemplateInputSchema.safeParse({
      ...validInput,
      send_automatic_email: 'yes',
    });
    expect(result.success).toBe(false);
  });
});
