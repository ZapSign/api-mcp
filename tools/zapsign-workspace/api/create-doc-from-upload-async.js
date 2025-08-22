/**
 * Function to create a document from an uploaded PDF asynchronously.
 *
 * @param {Object} args - Arguments for creating the document.
 * @param {string} args.name - The name of the document.
 * @param {string} args.url_pdf - The URL of the PDF to be uploaded.
 * @param {Array} args.signers - An array of signers for the document.
 * @param {string} [args.lang="pt-br"] - The language for the document.
 * @param {Array} [args.observers] - An array of observers for the document.
 * @returns {Promise<Object>} - The result of the document creation.
 */
import authService from '../../../lib/services/auth.js';

const executeFunction = async ({ name, url_pdf, signers, lang = 'pt-br', observers }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  // Note: docToken and signerToken are not used in this implementation
  // but kept for future use if needed

  try {
    // Construct the request body
    const body = {
      name,
      url_pdf,
      signers,
      lang,
      observers,
      disable_signer_emails: false,
      signed_file_only_finished: false,
      brand_logo: '',
      brand_primary_color: '',
      brand_name: '',
      folder_path: '/',
      created_by: '',
      date_limit_to_sign: null,
      signature_order_active: false,
      reminder_every_n_days: null,
      allow_refuse_signature: false,
      disable_signers_get_original_file: false,
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/docs/async/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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
    console.error('Error creating document:', error);
    return { error: 'An error occurred while creating the document.' };
  }
};

/**
 * Tool configuration for creating a document from an uploaded PDF asynchronously.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_doc_from_upload_async',
      description: 'Create a document from an uploaded PDF asynchronously.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the document.',
          },
          url_pdf: {
            type: 'string',
            description: 'The URL of the PDF to be uploaded.',
          },
          signers: {
            type: 'array',
            description: 'An array of signers for the document.',
          },
          lang: {
            type: 'string',
            description: 'The language for the document.',
          },
          observers: {
            type: 'array',
            description: 'An array of observers for the document.',
          },
        },
        required: ['name', 'url_pdf', 'signers'],
      },
    },
  },
};

export { apiTool };
