/**
 * Function to place signatures on a document using the Zapsign API.
 *
 * @param {Object} args - Arguments for placing signatures.
 * @param {Array} args.rubricas - An array of signature definitions.
 * @param {string} args.doc_token - The token of the document to place signatures on.
 * @returns {Promise<Object>} - The result of the signature placement.
 */
const executeFunction = async ({ rubricas, doc_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const apiToken = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the API request
    const url = `${apiUrl}/api/v1/docs/${doc_token}/place-signatures/`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    };

    // Prepare the body of the request
    const body = JSON.stringify({ rubricas });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers,
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
    console.error('Error placing signatures:', error);
    return { error: 'An error occurred while placing signatures.' };
  }
};

/**
 * Tool configuration for placing signatures on a document using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'place_signatures',
      description: 'Place signatures on a document using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          rubricas: {
            type: 'array',
            description: 'An array of signature definitions.'
          },
          doc_token: {
            type: 'string',
            description: 'The token of the document to place signatures on.'
          }
        },
        required: ['rubricas', 'doc_token']
      }
    }
  }
};

export { apiTool };