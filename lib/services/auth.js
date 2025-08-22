import { getZapSignConfig } from '../config.js';
import logger from '../logger.js';

class AuthenticationService {
  constructor () {
    this.config = getZapSignConfig();
    this.apiKey = this.config.apiKey;
    this.tokenExpiry = null;
    this.accessToken = null;
  }

  /**
   * Get the API key for authentication
   * @returns {string} API key
   */
  getApiKey () {
    return this.apiKey;
  }

  /**
   * Get authentication headers for API requests
   * @returns {Object} Headers object with Authorization
   */
  getAuthHeaders () {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('No API key available for authentication');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid format
   */
  validateApiKeyFormat (apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // ZapSign API keys are typically long alphanumeric strings
    // This is a basic validation - adjust based on actual format
    return apiKey.length >= 32 && /^[A-Za-z0-9_-]+$/.test(apiKey);
  }

  /**
   * Check if API key is valid by making a test request
   * @returns {Promise<boolean>} True if API key is valid
   */
  async validateApiKey () {
    try {
      const apiKey = this.getApiKey();

      if (!this.validateApiKeyFormat(apiKey)) {
        logger.warn('Invalid API key format');
        return false;
      }

      // Make a simple API call to test authentication
      // Using the templates endpoint as it's lightweight
      const response = await fetch(`${this.config.fullUrl}/models/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        logger.warn('API key validation failed - unauthorized');
        return false;
      }

      if (response.status === 403) {
        logger.warn('API key validation failed - forbidden');
        return false;
      }

      logger.info('API key validation successful');
      return true;
    } catch (error) {
      logger.error('API key validation error', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get authentication status
   * @returns {Promise<Object>} Authentication status
   */
  async getAuthenticationStatus () {
    const status = {
      hasKey: !!this.apiKey,
      isValid: false,
      lastChecked: null,
    };

    try {
      if (this.apiKey) {
        status.isValid = await this.validateApiKey();
        status.lastChecked = new Date().toISOString();
      }

      logger.info('Authentication status check completed', status);
    } catch (error) {
      logger.error('Authentication status check failed', { error: error.message });
    }

    return status;
  }

  /**
   * Get authentication headers (maintained for compatibility)
   * @returns {Object} Authentication headers
   */
  switchContext () {
    logger.info('Using main authentication context');
    return this.getAuthHeaders();
  }

  /**
   * Get current authentication context info
   * @returns {Object} Current authentication context information
   */
  getCurrentContext () {
    return {
      hasKey: !!this.apiKey,
      keyValid: this.validateApiKeyFormat(this.apiKey),
      context: 'main',
    };
  }

  /**
   * Refresh authentication if needed
   * @returns {Promise<boolean>} True if refresh was successful
   */
  async refreshAuthentication () {
    try {
      // For now, just revalidate the API keys
      // In the future, this could handle token refresh if ZapSign implements it
      const status = await this.getAuthenticationStatus();

      const hasValidKey = status.main.isValid || status.workspace.isValid;

      if (hasValidKey) {
        logger.info('Authentication refresh completed successfully');
        return true;
      } else {
        logger.error('No valid API keys found during refresh');
        return false;
      }
    } catch (error) {
      logger.error('Authentication refresh failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get authentication summary for logging
   * @returns {Object} Authentication summary
   */
  getAuthSummary () {
    return {
      hasKey: !!this.apiKey,
      keyLength: this.apiKey ? this.apiKey.length : 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const authService = new AuthenticationService();

export default authService;
