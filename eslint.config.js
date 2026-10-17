const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const globals = require('globals');

module.exports = tseslint.config(
  {
    ignores: ['node_modules/', 'src/main/docker/', 'webpack/', 'target/', 'coverage/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2018,
        I18N_HASH: 'readonly',
        SERVER_API_URL: 'readonly',
        __VERSION__: 'readonly',
        __DEBUG_INFO_ENABLED__: 'readonly',
      },
      parserOptions: {
        project: ['tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/relative-url-prefix': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/unbound-method': 'off',
      'arrow-body-style': 'error',
      curly: 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'guard-for-in': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-labels': 'error',
      'no-new': 'error',
      'no-new-wrappers': 'error',
      'object-shorthand': ['error', 'always', { avoidExplicitReturnArrows: true }],
      radix: 'error',
      'spaced-comment': ['warn', 'always'],
    },
  },
  {
    files: ['**/*.js'],
    extends: [eslint.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
