import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

/**
 * Function to add a signer to a document in Zapsign.
 *
 * @param {Object} args - Arguments for adding a signer.
 * @param {string} args.doc_token - The token of the document to which the signer will be added.
 * @param {string} args.name - The name of the signer to be added.
 * @returns {Promise<Object>} - The result of the add signer operation.
 */
const executeFunction = async ({ doc_token, name }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();

  try {
    // Construct the URL for the API request
    const url = `${apiUrl}/api/v1/docs/${doc_token}/add-signer/`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Prepare the body of the request
    const body = JSON.stringify({ name });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
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
    logger.error('Error adding signer:', error);
    return { error: 'An error occurred while adding the signer.' };
  }
};

/**
 * Tool configuration for adding a signer to a document in Zapsign.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'add_signer',
      description: 'Add a signer to a document in Zapsign.',
      parameters: {
        type: 'object',
        properties: {
          doc_token: {
            type: 'string',
            description: 'The token of the document to which the signer will be added.',
          },
          name: {
            type: 'string',
            description: 'The name of the signer to be added.',
          },
        },
        required: ['doc_token', 'name'],
      },
    },
  },
};

export { apiTool };
