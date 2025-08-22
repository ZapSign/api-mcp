/**
 * Function to retrieve details of a signer from the API.
 *
 * @param {Object} args - Arguments for the signer detail request.
 * @param {string} args.signer_token - The token of the signer whose details are to be retrieved.
 * @returns {Promise<Object>} - The result of the signer detail request.
 */
import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

const executeFunction = async ({ signer_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  try {
    // Construct the URL for the request
    const url = `${apiUrl}/api/v1/signers/${signer_token}/`;

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
    logger.error('Error retrieving signer details:', error);
    return { error: 'An error occurred while retrieving signer details.' };
  }
};

/**
 * Tool configuration for retrieving signer details from the API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'detail_signer',
      description: 'Retrieve details of a signer from the API.',
      parameters: {
        type: 'object',
        properties: {
          signer_token: {
            type: 'string',
            description: 'The token of the signer whose details are to be retrieved.',
          },
        },
        required: ['signer_token'],
      },
    },
  },
};

export { apiTool };
