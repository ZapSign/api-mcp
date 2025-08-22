/**
 * Function to create a document from a template using the Zapsign API.
 *
 * @param {Object} args - Arguments for creating the document.
 * @param {string} args.template_id - The ID of the template to use.
 * @param {string} args.signer_name - The name of the signer.
 * @param {boolean} [args.send_automatic_email=false] - Whether to send an automatic email.
 * @param {boolean} [args.send_automatic_whatsapp=false] - Whether to send an automatic WhatsApp message.
 * @param {string} [args.lang="pt-br"] - The language for the document.
 * @param {Array<Object>} args.data - An array of data objects for the document.
 * @returns {Promise<Object>} - The result of the document creation.
 */
const executeFunction = async ({ template_id, signer_name, send_automatic_email = false, send_automatic_whatsapp = false, lang = 'pt-br', data }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the request body
    const body = {
      template_id,
      signer_name,
      send_automatic_email,
      send_automatic_whatsapp,
      lang,
      external_id: null,
      data,
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/models/create-doc/`, {
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
    const dataResponse = await response.json();
    return dataResponse;
  } catch (error) {
    console.error('Error creating document from template:', error);
    return { error: 'An error occurred while creating the document.' };
  }
};

/**
 * Tool configuration for creating a document from a template using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_doc_from_template',
      description: 'Create a document from a template using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The ID of the template to use.',
          },
          signer_name: {
            type: 'string',
            description: 'The name of the signer.',
          },
          send_automatic_email: {
            type: 'boolean',
            description: 'Whether to send an automatic email.',
          },
          send_automatic_whatsapp: {
            type: 'boolean',
            description: 'Whether to send an automatic WhatsApp message.',
          },
          lang: {
            type: 'string',
            description: 'The language for the document.',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                de: { type: 'string', description: 'The key for the data.' },
                para: { type: 'string', description: 'The value for the data.' },
              },
              required: ['de', 'para'],
            },
            description: 'An array of data objects for the document.',
          },
        },
        required: ['template_id', 'signer_name', 'data'],
      },
    },
  },
};

export { apiTool };
