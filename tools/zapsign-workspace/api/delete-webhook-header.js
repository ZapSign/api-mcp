/**
 * Function to delete a webhook header.
 *
 * @param {Object} args - Arguments for the deletion.
 * @param {string} args.id - The ID of the webhook header to delete.
 * @returns {Promise<Object>} - The result of the deletion operation.
 */
const executeFunction = async ({ id }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the deletion request
    const url = `${apiUrl}/api/v1/user/company/webhook/header/delete/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Prepare the body for the request
    const body = JSON.stringify({ id });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    return await response.json();
  } catch (error) {
    console.error('Error deleting webhook header:', error);
    return { error: 'An error occurred while deleting the webhook header.' };
  }
};

/**
 * Tool configuration for deleting a webhook header.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_webhook_header',
      description: 'Delete a webhook header.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the webhook header to delete.'
          }
        },
        required: ['id']
      }
    }
  }
};

export { apiTool };