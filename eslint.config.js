/**
 * ESLint Configuration (Flat Config Format)
 * 
 * Minimal TypeScript ESLint configuration matching AGENTS.md conventions:
 * - 2-space indentation
 * - 100-character line length
 * - Required semicolons
 */

const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'semi': ['error', 'always'],
      '@typescript-eslint/indent': ['error', 2],
      'max-len': ['error', { 
        'code': 100,
        'ignoreComments': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true,
      }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'logs/',
      '**/*.js',
    ],
  },
];
