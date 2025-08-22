/**
 * Function to list templates from the Zapsign API.
 *
 * @param {Object} args - Arguments for the request.
 * @param {number} [args.page=1] - The page number for pagination.
 * @returns {Promise<Array>} - The list of templates.
 */
const executeFunction = async ({ page = 1 } = {}) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${apiUrl}/api/v1/templates/`);
    url.searchParams.append('page', page.toString());

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Perform the fetch request
    const response = await fetch(url.toString(), {
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
    console.error('Error listing templates:', error);
    return { error: 'An error occurred while listing templates.' };
  }
};

/**
 * Tool configuration for listing templates from the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'list_templates',
      description: 'List templates from the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'The page number for pagination.',
          },
        },
        required: [],
      },
    },
  },
};

export { apiTool };
