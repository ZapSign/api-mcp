// Test setup file for MCP ZapSign Server
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Mock fetch globally for tests
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Helper function to create mock ZapSign API responses
export const createMockZapSignResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(),
  });
};

// Helper function to create mock ZapSign API errors
export const createMockZapSignError = (status, message) => {
  return Promise.reject(new Error(message));
};

// Mock environment variables for testing
export const mockEnvVars = {
  ZAPSIGN_API_KEY: 'test_api_key_123456789',

  ZAPSIGN_BASE_URL: 'https://api.zapsign.com.br',
  ZAPSIGN_API_VERSION: 'v1',
  PORT: '3001',
  HOST: 'localhost',
  LOG_LEVEL: 'error',
  NODE_ENV: 'test',
};

// Set up test environment variables
Object.entries(mockEnvVars).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});
