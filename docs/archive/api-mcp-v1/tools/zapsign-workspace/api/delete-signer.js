/**
 * Function to delete a signer from the API.
 *
 * @param {Object} args - Arguments for the delete signer operation.
 * @param {string} args.signer_to_remove_token - The token of the signer to be removed.
 * @returns {Promise<Object>} - The result of the delete operation.
 */
import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

const executeFunction = async ({ signer_to_remove_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  try {
    // Construct the URL for the delete request
    const url = `${apiUrl}/api/v1/signer/${signer_to_remove_token}/remove/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Return the response data (if any)
    return await response.json();
  } catch (error) {
    logger.error('Error deleting signer:', error);
    return { error: 'An error occurred while deleting the signer.' };
  }
};

/**
 * Tool configuration for deleting a signer from the API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_signer',
      description: 'Delete a signer from the API.',
      parameters: {
        type: 'object',
        properties: {
          signer_to_remove_token: {
            type: 'string',
            description: 'The token of the signer to be removed.',
          },
        },
        required: ['signer_to_remove_token'],
      },
    },
  },
};

export { apiTool };
