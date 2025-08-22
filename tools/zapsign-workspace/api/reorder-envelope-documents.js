/**
 * Function to reorder documents in an envelope using the ZapSign API.
 *
 * @param {Object} args - Arguments for reordering envelope documents.
 * @param {string} args.envelope_token - The token of the envelope.
 * @param {Array} args.documents_order - Array of document tokens in the desired order.
 * @returns {Promise<Object>} - The result of the reordering operation.
 */
import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

const executeFunction = async ({ envelope_token, documents_order }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();

  try {
    // Validate input
    if (!Array.isArray(documents_order) || documents_order.length === 0) {
      throw new Error('documents_order must be a non-empty array');
    }

    // Construct the request body
    const body = {
      documents_order,
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/envelopes/${envelope_token}/reorder/`, {
      method: 'PUT',
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
    logger.error('Error reordering envelope documents:', error);
    return { error: 'An error occurred while reordering the envelope documents.' };
  }
};

/**
 * Tool configuration for reordering envelope documents using the ZapSign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'reorder_envelope_documents',
      description: 'Reorder documents within an envelope to change their display order.',
      parameters: {
        type: 'object',
        properties: {
          envelope_token: {
            type: 'string',
            description: 'The token of the envelope containing the documents.',
          },
          documents_order: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of document tokens in the desired display order.',
          },
        },
        required: ['envelope_token', 'documents_order'],
      },
    },
  },
};

export { apiTool };
