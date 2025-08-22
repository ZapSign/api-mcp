/**
 * Function to retrieve details of a document from the Zapsign API.
 *
 * @param {Object} args - Arguments for the document retrieval.
 * @param {string} args.doc_token - The token of the document to retrieve.
 * @returns {Promise<Object>} - The details of the document.
 */
const executeFunction = async ({ doc_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the document retrieval
    const url = `${apiUrl}/api/v1/docs/${doc_token}/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'GET',
      headers,
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
    console.error('Error retrieving document details:', error);
    return { error: 'An error occurred while retrieving document details.' };
  }
};

/**
 * Tool configuration for retrieving document details from the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'detail_doc',
      description: 'Retrieve details of a document from the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          doc_token: {
            type: 'string',
            description: 'The token of the document to retrieve.',
          },
        },
        required: ['doc_token'],
      },
    },
  },
};

export { apiTool };
