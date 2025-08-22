import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration schema validation
const ConfigSchema = z.object({
  // Server configuration
  port: z.coerce.number().default(3001),
  host: z.string().default('localhost'),

  // ZapSign API configuration
  zapsignApiKey: z.string().min(1, 'ZAPSIGN_API_KEY is required'),
  zapsignBaseUrl: z.string().url().default('https://api.zapsign.com.br'),
  zapsignApiVersion: z.string().default('v1'),

  // Logging configuration
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // MCP Server configuration
  serverName: z.string().default('mcp-server-zapsign'),
  serverVersion: z.string().default('1.0.0'),

  // Features configuration
  enableMetrics: z.coerce.boolean().default(false),
  enableRateLimiting: z.coerce.boolean().default(true),
  maxRequestsPerMinute: z.coerce.number().default(100),
});

/**
 * Get configuration with validation
 * @returns {Object} Validated configuration object
 */
export function getConfig () {
  try {
    const config = {
      port: process.env.PORT,
      host: process.env.HOST,
      zapsignApiKey: process.env.ZAPSIGN_API_KEY,

      zapsignBaseUrl: process.env.ZAPSIGN_BASE_URL,
      zapsignApiVersion: process.env.ZAPSIGN_API_VERSION,
      logLevel: process.env.LOG_LEVEL,
      serverName: process.env.SERVER_NAME,
      serverVersion: process.env.SERVER_VERSION,
      enableMetrics: process.env.ENABLE_METRICS,
      enableRateLimiting: process.env.ENABLE_RATE_LIMITING,
      maxRequestsPerMinute: process.env.MAX_REQUESTS_PER_MINUTE,
    };

    return ConfigSchema.parse(config);
  } catch (error) {
    logger.error('Configuration validation failed:', error.errors);
    process.exit(1);
  }
}

/**
 * Get ZapSign API configuration
 * @returns {Object} ZapSign API configuration
 */
export function getZapSignConfig () {
  const config = getConfig();
  return {
    apiKey: config.zapsignApiKey,
    baseUrl: config.zapsignBaseUrl,
    apiVersion: config.zapsignApiVersion,
    fullUrl: `${config.zapsignBaseUrl}/api/${config.zapsignApiVersion}`,
  };
}

/**
 * Get server configuration
 * @returns {Object} Server configuration
 */
export function getServerConfig () {
  const config = getConfig();
  return {
    port: config.port,
    host: config.host,
    name: config.serverName,
    version: config.serverVersion,
  };
}
