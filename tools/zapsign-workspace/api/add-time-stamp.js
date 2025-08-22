/**
 * Function to add a time stamp to a document using the Zapsign API.
 *
 * @param {Object} args - Arguments for adding the time stamp.
 * @param {string} args.url - The URL of the document to be timestamped.
 * @returns {Promise<Object>} - The response from the Zapsign API after adding the time stamp.
 */
const executeFunction = async ({ url }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the request body
    const body = JSON.stringify({ url });

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/timestamp/`, {
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
    console.error('Error adding time stamp:', error);
    return { error: 'An error occurred while adding the time stamp.' };
  }
};

/**
 * Tool configuration for adding a time stamp using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'add_time_stamp',
      description: 'Add a time stamp to a document using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL of the document to be timestamped.',
          },
        },
        required: ['url'],
      },
    },
  },
};

export { apiTool };
