import axios from 'axios';
import { getZapSignConfig } from '../config.js';
import logger from '../logger.js';

class ZapSignApiClient {
  constructor () {
    const config = getZapSignConfig();
    this.baseURL = config.fullUrl;
    this.apiKey = config.apiKey;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-ZapSign-Server/1.0.0',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Use the main API key
        config.headers.Authorization = `Bearer ${this.apiKey}`;

        logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      (error) => {
        logger.error('API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      },
    );
  }

  /**
   * Make a GET request to ZapSign API
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async get (endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'GET', endpoint);
      throw error;
    }
  }

  /**
   * Make a POST request to ZapSign API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} API response
   */
  async post (endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'POST', endpoint);
      throw error;
    }
  }

  /**
   * Make a PUT request to ZapSign API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} API response
   */
  async put (endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'PUT', endpoint);
      throw error;
    }
  }

  /**
   * Make a DELETE request to ZapSign API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} API response
   */
  async delete (endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'DELETE', endpoint);
      throw error;
    }
  }

  /**
   * Upload a file to ZapSign API
   * @param {string} endpoint - API endpoint
   * @param {Buffer|string} fileData - File data (base64 or buffer)
   * @param {string} fileName - File name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} API response
   */
  async uploadFile (endpoint, fileData, fileName, mimeType) {
    try {
      let fileBuffer;

      if (typeof fileData === 'string') {
        // Handle base64 string
        if (fileData.startsWith('data:')) {
          // Remove data URL prefix
          const base64Data = fileData.split(',')[1];
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Assume it's already base64
          fileBuffer = Buffer.from(fileData, 'base64');
        }
      } else if (Buffer.isBuffer(fileData)) {
        fileBuffer = fileData;
      } else {
        throw new Error('Invalid file data format');
      }

      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType });
      formData.append('file', blob, fileName);

      const response = await this.client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error, 'POST', endpoint);
      throw error;
    }
  }

  /**
   * Handle API errors and provide meaningful error messages
   * @param {Error} error - Error object
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   */
  handleApiError (error, method, endpoint) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          error.message = `Bad Request: ${data?.message || 'Invalid parameters'}`;
          break;
        case 401:
          error.message = 'Unauthorized: Invalid API key or authentication failed';
          break;
        case 403:
          error.message = 'Forbidden: Insufficient permissions for this operation';
          break;
        case 404:
          error.message = `Not Found: ${endpoint} endpoint not found`;
          break;
        case 429:
          error.message = 'Rate Limited: Too many requests, please try again later';
          break;
        case 500:
          error.message = 'Internal Server Error: ZapSign service temporarily unavailable';
          break;
        default:
          error.message = `HTTP ${status}: ${data?.message || 'Unknown error'}`;
      }
    } else if (error.request) {
      // Request was made but no response received
      error.message = 'No response received from ZapSign API';
    } else {
      // Something else happened
      error.message = `Request setup error: ${error.message}`;
    }

    // Add context to error
    error.context = {
      method,
      endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if the API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async healthCheck () {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      logger.warn('ZapSign API health check failed', error.message);
      return false;
    }
  }
}

// Create singleton instance
const zapsignApiClient = new ZapSignApiClient();

export default zapsignApiClient;
