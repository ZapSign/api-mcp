/**
 * Function to delete a document using the Zapsign API.
 *
 * @param {Object} args - Arguments for the delete request.
 * @param {string} args.doc_token - The token of the document to be deleted.
 * @returns {Promise<Object>} - The result of the delete operation.
 */
const executeFunction = async ({ doc_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  try {
    // Construct the URL for the delete request
    const url = `${apiUrl}/api/v1/docs/${doc_token}/`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Return success response
    return { message: 'Document deleted successfully.' };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: 'An error occurred while deleting the document.' };
  }
};

/**
 * Tool configuration for deleting a document using the Zapsign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_doc',
      description: 'Delete a document using the Zapsign API.',
      parameters: {
        type: 'object',
        properties: {
          doc_token: {
            type: 'string',
            description: 'The token of the document to be deleted.'
          }
        },
        required: ['doc_token']
      }
    }
  }
};

export { apiTool };