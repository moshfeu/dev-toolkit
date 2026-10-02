// See the "eslint-config/" section in this repo's README.md.
import tseslint from 'typescript-eslint';

const DEFAULT_ENV_EXEMPT_FILES = ['**/*.test.js', '**/*.test.ts', 'test-setup.js', 'test-setup.ts'];

export default function sharedConfig({ configFiles = false, extraEnvExemptFiles = [], ignores = ['node_modules/**', 'dist/**'] } = {}) {
  const base = [
    ...tseslint.configs.recommended,
    { ignores },
    {
      languageOptions: {
        parserOptions: { ecmaVersion: 2023, sourceType: 'module' },
        globals: {
          process: 'readonly',
          console: 'readonly',
          fetch: 'readonly',
          Response: 'readonly',
          Buffer: 'readonly',
          URL: 'readonly',
          URLSearchParams: 'readonly',
          FormData: 'readonly',
          Blob: 'readonly',
          setTimeout: 'readonly',
          globalThis: 'readonly',
        },
      },
      rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] },
    },
  ];

  if (!configFiles) return base;

  const noProcessEnv = {
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: `Do not access process.env directly -- add/read the value in one of: ${[].concat(configFiles).join(', ')} instead.`,
      },
    ],
  };

  return [
    ...base,
    { rules: noProcessEnv },
    { files: [].concat(configFiles), rules: { 'no-restricted-properties': 'off' } },
    { files: [...DEFAULT_ENV_EXEMPT_FILES, ...extraEnvExemptFiles], rules: { 'no-restricted-properties': 'off' } },
  ];
}
