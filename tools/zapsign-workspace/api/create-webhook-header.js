/**
 * Function to create a webhook header in the Zapsign API.
 *
 * @param {Object} args - Arguments for creating the webhook header.
 * @param {number} args.webhook_id - The ID of the webhook to create the header for.
 * @returns {Promise<Object>} - The result of the webhook header creation.
 */
const executeFunction = async ({ webhook_id }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the API request
    const url = `${apiUrl}/api/v1/user/company/webhook/header/`;

    // Set up the request body
    const body = JSON.stringify({
      id: webhook_id,
      headers: [
        {
          name: 'Authorization',
          value: `Bearer ${token}`
        }
      ]
    });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
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
    console.error('Error creating webhook header:', error);
    return { error: 'An error occurred while creating the webhook header.' };
  }
};

/**
 * Tool configuration for creating a webhook header in the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_webhook_header',
      description: 'Create a webhook header in the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          webhook_id: {
            type: 'number',
            description: 'The ID of the webhook to create the header for.'
          }
        },
        required: ['webhook_id']
      }
    }
  }
};

export { apiTool };