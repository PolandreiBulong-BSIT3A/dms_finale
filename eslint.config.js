import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Frontend/React files configuration (must come first)
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/lib/api/backend/**/*.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        varsIgnorePattern: '^[A-Z_]', 
        argsIgnorePattern: '^_|^e$|^err$|^error$|^index$|^role$|^user$|^Icon$|^token$|^sidebarOpen$|^setRole$',
        caughtErrorsIgnorePattern: '^_|^e$|^err$|^error$'
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Backend/Node.js files configuration (must come after to override)
  {
    files: ['server.js', 'src/lib/api/backend/**/*.js', 'scripts/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        varsIgnorePattern: '^[A-Z_]|^execAsync$|^stats$|^requireAdmin$|^requireDean$|^errorHandler$|^upload$|^isAdminRole$|^isDeanRole$|^securityHeaders$', 
        argsIgnorePattern: '^_|^e$|^err$|^error$|^next$|^token$',
        caughtErrorsIgnorePattern: '^_|^e$|^err$|^error$|^dbError$'
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'off', // Turn off for backend since Node.js globals are defined
      'no-useless-escape': 'warn',
    },
  },
])
