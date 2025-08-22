module.exports = {
  preset: 'default',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'lib/**/*.js',
    'tools/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
