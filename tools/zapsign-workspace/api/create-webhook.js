import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to create a webhook in Zapsign.
 *
 * @param {Object} args - Arguments for the webhook creation.
 * @param {string} args.url - The URL to which the webhook will send notifications.
 * @param {string} args.type - The type of event that triggers the webhook.
 * @param {Array<Object>} [args.headers] - Optional headers to include in the webhook request.
 * @returns {Promise<Object>} - The result of the webhook creation.
 */
const executeFunction = async ({ url, type, headers = [] }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const apiToken = authService.getApiKey();
  const requestBody = {
    url,
    type,
    headers,
  };

  try {
    // Set up headers for the request
    const fetchHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/user/company/webhook/`, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify(requestBody),
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
    logger.error('Error creating webhook:', error);
    return { error: 'An error occurred while creating the webhook.' };
  }
};

/**
 * Tool configuration for creating a webhook in Zapsign.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_webhook',
      description: 'Create a webhook in Zapsign.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to which the webhook will send notifications.',
          },
          type: {
            type: 'string',
            description: 'The type of event that triggers the webhook.',
          },
          headers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the header.',
                },
                value: {
                  type: 'string',
                  description: 'The value of the header.',
                },
              },
              required: ['name', 'value'],
            },
            description: 'Optional headers to include in the webhook request.',
          },
        },
        required: ['url', 'type'],
      },
    },
  },
};

export { apiTool };
