/**
 * Function to create a document from an uploaded PDF using the Zapsign API.
 *
 * @param {Object} args - Arguments for creating the document.
 * @param {string} args.name - The name of the document.
 * @param {string} args.url_pdf - The URL of the PDF to upload.
 * @param {Array<Object>} args.signers - An array of signers for the document.
 * @param {string} [args.lang="pt-br"] - The language for the document.
 * @param {Array<string>} [args.observers=[]] - An array of observer emails.
 * @returns {Promise<Object>} - The result of the document creation.
 */
const executeFunction = async ({ name, url_pdf, signers, lang = 'pt-br', observers = [] }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  const docToken = ''; // will be provided by the user
  const signerToken = ''; // will be provided by the user

  try {
    // Construct the request body
    const body = {
      name,
      url_pdf,
      signers,
      lang,
      observers,
      disable_signer_emails: false,
      brand_logo: '',
      brand_primary_color: '',
      brand_name: '',
      folder_path: '/',
      created_by: '',
      date_limit_to_sign: null,
      signature_order_active: false,
      reminder_every_n_days: 0,
      allow_refuse_signature: false,
      disable_signers_get_original_file: false
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/docs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
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
 * Tool configuration for creating a document from an uploaded PDF using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_doc_from_upload_pdf',
      description: 'Create a document from an uploaded PDF.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the document.'
          },
          url_pdf: {
            type: 'string',
            description: 'The URL of the PDF to upload.'
          },
          signers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the signer.'
                },
                email: {
                  type: 'string',
                  description: 'The email of the signer.'
                },
                auth_mode: {
                  type: 'string',
                  description: 'The authentication mode for the signer.'
                },
                send_automatic_email: {
                  type: 'boolean',
                  description: 'Whether to send an automatic email to the signer.'
                },
                phone_country: {
                  type: 'string',
                  description: 'The country code for the signers phone number.'
                },
                phone_number: {
                  type: 'string',
                  description: 'The phone number of the signer.'
                },
                require_selfie_photo: {
                  type: 'boolean',
                  description: 'Whether a selfie photo is required.'
                },
                require_document_photo: {
                  type: 'boolean',
                  description: 'Whether a document photo is required.'
                }
              },
              required: ['name']
            },
            description: 'An array of signers for the document.'
          },
          lang: {
            type: 'string',
            description: 'The language for the document.'
          },
          observers: {
            type: 'array',
            items: {
              type: 'string',
              description: 'An array of observer emails.'
            },
            description: 'An array of observer emails.'
          }
        },
        required: ['name', 'url_pdf', 'signers']
      }
    }
  }
};

export { apiTool };