const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/tests/integration/repositories.test.ts'],
  transformIgnorePatterns: ['node_modules/(?!(mongodb-memory-server-core|mongodb)/)'],
  testTimeout: 30000,
});
