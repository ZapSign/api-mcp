/**
 * Function to create a document from a template asynchronously using the Zapsign API.
 *
 * @param {Object} args - Arguments for creating the document.
 * @param {string} args.template_id - The ID of the template to use for the document.
 * @param {string} args.signer_name - The name of the signer.
 * @param {boolean} [args.send_automatic_email=false] - Whether to send an automatic email.
 * @param {boolean} [args.send_automatic_whatsapp=false] - Whether to send an automatic WhatsApp message.
 * @param {string} [args.lang="pt-br"] - The language for the document.
 * @param {string} [args.external_id=null] - An optional external ID for tracking.
 * @param {Array<Object>} args.data - An array of objects containing data to fill in the template.
 * @returns {Promise<Object>} - The result of the document creation request.
 */
const executeFunction = async ({ template_id, signer_name, send_automatic_email = false, send_automatic_whatsapp = false, lang = 'pt-br', external_id = null, data }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;

  try {
    // Construct the request body
    const requestBody = {
      template_id,
      signer_name,
      send_automatic_email,
      send_automatic_whatsapp,
      lang,
      external_id,
      data
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/models/create-doc/async/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const dataResponse = await response.json();
    return dataResponse;
  } catch (error) {
    console.error('Error creating document:', error);
    return { error: 'An error occurred while creating the document.' };
  }
};

/**
 * Tool configuration for creating a document from a template asynchronously using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_doc_from_template_async',
      description: 'Create a document from a template asynchronously using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The ID of the template to use for the document.'
          },
          signer_name: {
            type: 'string',
            description: 'The name of the signer.'
          },
          send_automatic_email: {
            type: 'boolean',
            description: 'Whether to send an automatic email.'
          },
          send_automatic_whatsapp: {
            type: 'boolean',
            description: 'Whether to send an automatic WhatsApp message.'
          },
          lang: {
            type: 'string',
            description: 'The language for the document.'
          },
          external_id: {
            type: 'string',
            description: 'An optional external ID for tracking.'
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                de: {
                  type: 'string',
                  description: 'The field name in the template.'
                },
                para: {
                  type: 'string',
                  description: 'The value to fill in the template.'
                }
              },
              required: ['de', 'para']
            },
            description: 'An array of objects containing data to fill in the template.'
          }
        },
        required: ['template_id', 'signer_name', 'data']
      }
    }
  }
};

export { apiTool };