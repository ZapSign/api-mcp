/**
 * Function to get documents from the Zapsign API.
 *
 * @returns {Promise<Array>} - The list of documents from the API.
 */
import authService from '../../../lib/services/auth.js';

const executeFunction = async () => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  try {
    // Set up the URL for the request
    const url = `${apiUrl}/api/v1/docs/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
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
    console.error('Error getting documents:', error);
    return { error: 'An error occurred while getting documents.' };
  }
};

/**
 * Tool configuration for getting documents from the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_docs',
      description: 'Get documents from the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
};

export { apiTool };
