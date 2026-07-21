import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to create a document from an uploaded DOCX file using the Zapsign API.
 *
 * @param {Object} args - Arguments for creating the document.
 * @param {string} args.name - The name of the document.
 * @param {string} args.url_docx - The URL of the DOCX file to be uploaded.
 * @param {Array<Object>} args.signers - An array of signers for the document.
 * @param {string} [args.lang="pt-br"] - The language for the document.
 * @param {boolean} [args.disable_signer_emails=false] - Whether to disable emails for signers.
 * @param {Array<string>} [args.observers=[]] - An array of observer emails.
 * @returns {Promise<Object>} - The result of the document creation.
 */
const executeFunction = async ({ name, url_docx, signers, lang = 'pt-br', disable_signer_emails = false, observers = [] }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  const payload = {
    name,
    url_docx,
    signers,
    lang,
    disable_signer_emails,
    observers,
  };

  try {
    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/docs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error creating document:', error);
    return { error: 'An error occurred while creating the document.' };
  }
};

/**
 * Tool configuration for creating a document from an uploaded DOCX file using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_doc_from_upload',
      description: 'Create a document from an uploaded DOCX file.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the document.',
          },
          url_docx: {
            type: 'string',
            description: 'The URL of the DOCX file to be uploaded.',
          },
          signers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the signer.',
                },
                email: {
                  type: 'string',
                  description: 'The email of the signer.',
                },
                auth_mode: {
                  type: 'string',
                  description: 'The authentication mode for the signer.',
                },
                send_automatic_email: {
                  type: 'boolean',
                  description: 'Whether to send automatic email to the signer.',
                },
                phone_country: {
                  type: 'string',
                  description: 'The country prefix for the signers phone number.',
                },
                phone_number: {
                  type: 'string',
                  description: 'The phone number of the signer.',
                },
              },
              required: ['name'],
            },
            description: 'An array of signers for the document.',
          },
          lang: {
            type: 'string',
            description: 'The language for the document.',
          },
          disable_signer_emails: {
            type: 'boolean',
            description: 'Whether to disable emails for signers.',
          },
          observers: {
            type: 'array',
            items: {
              type: 'string',
              description: 'An array of observer emails.',
            },
            description: 'An array of observer emails.',
          },
        },
        required: ['name', 'url_docx', 'signers'],
      },
    },
  },
};

export { apiTool };
