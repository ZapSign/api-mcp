/**
 * Function to update a signer in the Zapsign API.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.signer_token - The token of the signer to be updated.
 * @param {string} args.name - The new name for the signer.
 * @returns {Promise<Object>} - The result of the update operation.
 */
const executeFunction = async ({ signer_token, name }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the update request
    const url = `${apiUrl}/api/v1/signers/${signer_token}/`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
    };

    // If a token is provided, add it to the Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
    console.error('Error updating signer:', error);
    return { error: 'An error occurred while updating the signer.' };
  }
};

/**
 * Tool configuration for updating a signer in the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_signer',
      description: 'Update a signer in the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          signer_token: {
            type: 'string',
            description: 'The token of the signer to be updated.'
          },
          name: {
            type: 'string',
            description: 'The new name for the signer.'
          }
        },
        required: ['signer_token', 'name']
      }
    }
  }
};

export { apiTool };