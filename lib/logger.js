import winston from 'winston';
import { getConfig } from './config.js';

const config = getConfig();

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'mcp-zapsign-server' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {string} toolName - MCP tool name
 */
export function logApiRequest (method, endpoint, params, toolName) {
  logger.info('API Request', {
    method,
    endpoint,
    toolName,
    params: params ? JSON.stringify(params) : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} response - API response
 * @param {number} statusCode - HTTP status code
 * @param {string} toolName - MCP tool name
 */
export function logApiResponse (method, endpoint, response, statusCode, toolName) {
  logger.info('API Response', {
    method,
    endpoint,
    toolName,
    statusCode,
    responseSize: response ? JSON.stringify(response).length : 0,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log API error
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Error} error - Error object
 * @param {string} toolName - MCP tool name
 */
export function logApiError (method, endpoint, error, toolName) {
  logger.error('API Error', {
    method,
    endpoint,
    toolName,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log MCP tool execution
 * @param {string} toolName - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} result - Tool result
 */
export function logToolExecution (toolName, args, result) {
  logger.info('Tool Execution', {
    toolName,
    args: JSON.stringify(args),
    resultSize: result ? JSON.stringify(result).length : 0,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log MCP tool error
 * @param {string} toolName - Tool name
 * @param {Object} args - Tool arguments
 * @param {Error} error - Error object
 */
export function logToolError (toolName, args, error) {
  logger.error('Tool Error', {
    toolName,
    args: JSON.stringify(args),
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}

export default logger;
