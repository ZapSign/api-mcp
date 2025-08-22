/**
 * Function to add an extra document to Zapsign.
 *
 * @param {Object} args - Arguments for the document upload.
 * @param {string} args.name - The name of the extra document.
 * @param {string} args.url_pdf - The URL of the PDF document to upload.
 * @param {string} [args.doc_token] - The token for the document.
 * @returns {Promise<Object>} - The result of the document upload.
 */
const executeFunction = async ({ name, url_pdf, doc_token }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = process.env.ZAPSIGN_WORKSPACE_API_KEY;
  const documentToken = doc_token || ''; // will be provided by the user

  try {
    // Construct the URL for the document upload
    const url = `${apiUrl}/api/v1/docs/${documentToken}/upload-extra-doc/`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Prepare the body of the request
    const body = JSON.stringify({
      name,
      url_pdf,
    });

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
    console.error('Error adding extra document:', error);
    return { error: 'An error occurred while adding the extra document.' };
  }
};

/**
 * Tool configuration for adding an extra document to Zapsign.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'add_extra_doc',
      description: 'Add an extra document to Zapsign.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the extra document.',
          },
          url_pdf: {
            type: 'string',
            description: 'The URL of the PDF document to upload.',
          },
          doc_token: {
            type: 'string',
            description: 'The token for the document.',
          },
        },
        required: ['name', 'url_pdf'],
      },
    },
  },
};

export { apiTool };
