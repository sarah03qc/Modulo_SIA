import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const reactRecommended = react.configs.flat?.recommended || react.configs.recommended;

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'coverage/**', '.local/**']
  },
  js.configs.recommended,
  {
    files: ['apps/api/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    }
  },
  {
    files: ['apps/web/**/*.{js,jsx}'],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser }
    },
    settings: { react: { version: '19.3.1' } },
    rules: {
      ...reactRecommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off'
    }
  },
  {
    files: ['apps/web/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error'
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node }
    }
  },
  {
    files: ['**/*.test.js', '**/*.test.jsx', 'apps/web/tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest }
    }
  }
];
