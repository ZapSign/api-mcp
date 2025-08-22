/**
 * Function to get the details of a template from Zapsign.
 *
 * @param {Object} args - Arguments for the template detail request.
 * @param {string} args.template_token - The token of the template to retrieve details for.
 * @returns {Promise<Object>} - The result of the template detail request.
 */
const executeFunction = async ({ template_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const apiToken = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the request
    const url = `${apiUrl}/api/v1/templates/${template_token}`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${apiToken}`,
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'GET',
      headers,
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
    console.error('Error retrieving template details:', error);
    return { error: 'An error occurred while retrieving template details.' };
  }
};

/**
 * Tool configuration for retrieving template details from Zapsign.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'detail_template',
      description: 'Retrieve details of a specific template from Zapsign.',
      parameters: {
        type: 'object',
        properties: {
          template_token: {
            type: 'string',
            description: 'The token of the template to retrieve details for.',
          },
        },
        required: ['template_token'],
      },
    },
  },
};

export { apiTool };
