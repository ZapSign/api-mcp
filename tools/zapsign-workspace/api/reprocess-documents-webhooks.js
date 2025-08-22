/**
 * Function to reprocess documents and webhooks using the ZapSign API.
 *
 * @param {Object} args - Arguments for reprocessing documents and webhooks.
 * @param {string} args.document_token - The token of the document to reprocess.
 * @param {Array} args.webhook_tokens - Array of webhook tokens to reprocess (optional).
 * @param {string} args.reason - Reason for reprocessing (optional).
 * @param {boolean} args.force_reprocess - Force reprocessing even if already processed (optional).
 * @returns {Promise<Object>} - The result of the reprocessing operation.
 */
const executeFunction = async ({ document_token, webhook_tokens, reason, force_reprocess }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;

  try {
    // Validate input
    if (!document_token) {
      throw new Error('document_token is required');
    }

    // Construct the request body
    const body = {
      document_token,
      webhook_tokens,
      reason,
      force_reprocess,
    };

    // Remove undefined values
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/reprocess/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reprocessing documents and webhooks:', error);
    return { error: 'An error occurred while reprocessing documents and webhooks.' };
  }
};

/**
 * Tool configuration for reprocessing documents and webhooks using the ZapSign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'reprocess_documents_webhooks',
      description: 'Reprocess documents and webhooks in the ZapSign system.',
      parameters: {
        type: 'object',
        properties: {
          document_token: {
            type: 'string',
            description: 'The token of the document to reprocess.',
          },
          webhook_tokens: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of webhook tokens to reprocess (optional).',
          },
          reason: {
            type: 'string',
            description: 'Reason for reprocessing (optional).',
          },
          force_reprocess: {
            type: 'boolean',
            description: 'Force reprocessing even if already processed (optional).',
          },
        },
        required: ['document_token'],
      },
    },
  },
};

export { apiTool };
