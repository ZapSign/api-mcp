import authService from '../../../lib/services/auth.js';

/**
 * Function to sign in a batch using the Zapsign API.
 *
 * @param {Object} args - Arguments for the sign-in request.
 * @param {string} args.user_token - The user token for authentication.
 * @param {Array<string>} args.signer_tokens - An array of signer tokens.
 * @returns {Promise<Object>} - The result of the sign-in operation.
 */
const executeFunction = async ({ user_token, signer_tokens }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const apiToken = authService.getApiKey();
  try {
    // Construct the URL for the sign-in request
    const url = `${apiUrl}/api/v1/sign/`;

    // Set up the request body
    const body = JSON.stringify({
      user_token,
      signer_tokens,
    });

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    };

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
    console.error('Error signing in batch:', error);
    return { error: 'An error occurred while signing in batch.' };
  }
};

/**
 * Tool configuration for signing in a batch using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'sign_in_batch',
      description: 'Sign in a batch using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          user_token: {
            type: 'string',
            description: 'The user token for authentication.',
          },
          signer_tokens: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'An array of signer tokens.',
          },
        },
        required: ['user_token', 'signer_tokens'],
      },
    },
  },
};

export { apiTool };
