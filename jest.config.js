/** @type {import('jest').Config} */
module.exports = {
  // Data-layer tests run in plain Node against a real SQLite engine
  // (better-sqlite3). They do not need the React Native test environment.
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
