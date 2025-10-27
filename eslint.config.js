import js from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/node_modules/**', 'coverage/**', '.vercel/**', 'vercel/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      import: eslintPluginImport
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js']
        }
      }
    },
    rules: {
      'no-console': 'off',
      'import/no-unresolved': 'error',
      'import/newline-after-import': 'off',
      'import/order': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },
  eslintConfigPrettier
];
