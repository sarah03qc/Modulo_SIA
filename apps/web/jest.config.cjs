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
    '\\.css$': '<rootDir>/tests/style-mock.cjs',
    '\\.(png|ico)$': '<rootDir>/tests/archivo-mock.cjs',
    '^echarts/core$': '<rootDir>/tests/echarts-mock.cjs',
    '^echarts/charts$': '<rootDir>/tests/echarts-mock.cjs',
    '^echarts/components$': '<rootDir>/tests/echarts-mock.cjs',
    '^echarts/renderers$': '<rootDir>/tests/echarts-mock.cjs'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
