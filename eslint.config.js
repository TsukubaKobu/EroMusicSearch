const prettier = require('eslint-config-prettier');

const nodeGlobals = {
  require: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  URLSearchParams: 'readonly',
  URL: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  Promise: 'readonly',
};

const browserGlobals = {
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  HTMLElement: 'readonly',
  HTMLTableRowElement: 'readonly',
  HTMLTableElement: 'readonly',
};

module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-unused-expressions': 'error',
    },
  },
  {
    files: ['main.js', 'preload.js', 'src/**/*.js'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: Object.assign({}, nodeGlobals, {
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        before: 'readonly',
        after: 'readonly',
      }),
    },
  },
  {
    files: ['renderer.js'],
    languageOptions: {
      globals: browserGlobals,
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
  prettier,
];
