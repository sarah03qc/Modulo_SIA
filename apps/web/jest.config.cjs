'use strict';

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/tests/**/*.test.jsx'],
  transform: {
    '^.+\\.(js|jsx)$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'ecmascript', jsx: true },
        transform: { react: { runtime: 'automatic' } }
      },
      module: { type: 'commonjs' }
    }]
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/tests/style-mock.cjs'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
