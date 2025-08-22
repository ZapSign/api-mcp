/**
 * Function to create a partner account in the ZapSign API.
 *
 * @param {Object} args - Arguments for creating a partner account.
 * @param {string} args.name - The name of the partner.
 * @param {string} args.email - The email of the partner.
 * @param {string} args.phone - The phone number of the partner.
 * @param {string} args.cpf - The CPF (Brazilian individual taxpayer number) of the partner.
 * @param {string} args.cnpj - The CNPJ (Brazilian company taxpayer number) of the partner.
 * @param {string} args.company_name - The name of the company (if applicable).
 * @param {string} args.external_id - External identifier for the partner.
 * @returns {Promise<Object>} - The result of the partner account creation.
 */
import authService from '../../../lib/services/auth.js';

const executeFunction = async ({ name, email, phone, cpf, cnpj, company_name, external_id }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();

  try {
    // Construct the request body
    const body = {
      name,
      email,
      phone,
      cpf,
      cnpj,
      company_name,
      external_id,
    };

    // Remove undefined values
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/partners/`, {
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
    console.error('Error creating partner account:', error);
    return { error: 'An error occurred while creating the partner account.' };
  }
};

/**
 * Tool configuration for creating a partner account using the ZapSign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_partner_account',
      description: 'Create a new partner account in the ZapSign system.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the partner.',
          },
          email: {
            type: 'string',
            description: 'The email address of the partner.',
          },
          phone: {
            type: 'string',
            description: 'The phone number of the partner (Brazilian format).',
          },
          cpf: {
            type: 'string',
            description: 'The CPF (Brazilian individual taxpayer number) of the partner.',
          },
          cnpj: {
            type: 'string',
            description: 'The CNPJ (Brazilian company taxpayer number) of the partner.',
          },
          company_name: {
            type: 'string',
            description: 'The name of the company (if applicable).',
          },
          external_id: {
            type: 'string',
            description: 'External identifier for the partner.',
          },
        },
        required: ['name', 'email'],
      },
    },
  },
};

export { apiTool };
