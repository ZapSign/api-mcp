/**
 * Function to update partner payment status in the ZapSign API.
 *
 * @param {Object} args - Arguments for updating partner payment status.
 * @param {string} args.partner_token - The token of the partner.
 * @param {string} args.payment_status - The new payment status.
 * @param {string} args.payment_method - The payment method used.
 * @param {string} args.transaction_id - The transaction ID (optional).
 * @param {string} args.notes - Additional notes about the payment (optional).
 * @returns {Promise<Object>} - The result of the payment status update.
 */
import authService from '../../../lib/services/auth.js';
import { logger } from '../../../lib/logger.js';

const executeFunction = async ({ partner_token, payment_status, payment_method, transaction_id, notes }) => {
  const apiUrl = 'https://api.zapsign.com.br';
  const token = authService.getApiKey();

  try {
    // Construct the request body
    const body = {
      payment_status,
      payment_method,
      transaction_id,
      notes,
    };

    // Remove undefined values
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // Perform the fetch request
    const response = await fetch(`${apiUrl}/api/v1/partners/${partner_token}/payment-status/`, {
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
    logger.error('Error updating partner payment status:', error);
    return { error: 'An error occurred while updating the partner payment status.' };
  }
};

/**
 * Tool configuration for updating partner payment status using the ZapSign API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_partner_payment_status',
      description: 'Update the payment status of a partner in the ZapSign system.',
      parameters: {
        type: 'object',
        properties: {
          partner_token: {
            type: 'string',
            description: 'The token of the partner to update.',
          },
          payment_status: {
            type: 'string',
            description: 'The new payment status (e.g., "paid", "pending", "failed").',
            enum: ['paid', 'pending', 'failed', 'cancelled'],
          },
          payment_method: {
            type: 'string',
            description: 'The payment method used (e.g., "credit_card", "pix", "bank_transfer").',
          },
          transaction_id: {
            type: 'string',
            description: 'The transaction ID from the payment processor (optional).',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the payment (optional).',
          },
        },
        required: ['partner_token', 'payment_status', 'payment_method'],
      },
    },
  },
};

export { apiTool };
