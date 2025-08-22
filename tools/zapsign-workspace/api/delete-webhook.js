/**
 * Function to delete a webhook from the Zapsign API.
 *
 * @param {Object} args - Arguments for the delete webhook request.
 * @param {string} args.webhook_id - The ID of the webhook to be deleted.
 * @returns {Promise<Object>} - The result of the delete webhook operation.
 */
import authService from '../../../lib/services/auth.js';

const executeFunction = async ({ webhook_id }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();
  try {
    // Construct the URL for the delete request
    const url = `${apiUrl}/api/v1/user/company/webhook/delete/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Prepare the body for the request
    const body = JSON.stringify({ id: webhook_id });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body,
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    return await response.json();
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return { error: 'An error occurred while deleting the webhook.' };
  }
};

/**
 * Tool configuration for deleting a webhook from the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_webhook',
      description: 'Delete a webhook from the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          webhook_id: {
            type: 'string',
            description: 'The ID of the webhook to be deleted.',
          },
        },
        required: ['webhook_id'],
      },
    },
  },
};

export { apiTool };
