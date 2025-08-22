/**
 * Function to add an extra document from a template in Zapsign.
 *
 * @param {Object} args - Arguments for adding the extra document.
 * @param {string} args.template_id - The ID of the template to use.
 * @param {Array<Object>} args.data - An array of objects containing the data to be filled in the document.
 * @returns {Promise<Object>} - The result of the document upload operation.
 */
const executeFunction = async ({ template_id, data }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  const docToken = ''; // will be provided by the user

  try {
    // Construct the URL for the request
    const url = `${apiUrl}/api/v1/models/${docToken}/upload-extra-doc/`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Prepare the body of the request
    const body = JSON.stringify({
      template_id,
      data,
    });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error adding extra document:', error);
    return { error: 'An error occurred while adding the extra document.' };
  }
};

/**
 * Tool configuration for adding an extra document from a template in Zapsign.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'add_extra_doc_from_template',
      description: 'Add an extra document from a template in Zapsign.',
      parameters: {
        type: 'object',
        properties: {
          template_id: {
            type: 'string',
            description: 'The ID of the template to use.',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                de: {
                  type: 'string',
                  description: 'The value to fill in the document.',
                },
                para: {
                  type: 'string',
                  description: 'The field name in the document.',
                },
              },
              required: ['de', 'para'],
            },
            description: 'An array of objects containing the data to be filled in the document.',
          },
        },
        required: ['template_id', 'data'],
      },
    },
  },
};

export { apiTool };
