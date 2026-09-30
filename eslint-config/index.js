// Shared flat ESLint config: typescript-eslint recommended, plus an
// opt-in rule restricting direct `process.env` access to a single
// "config" module -- the idea (and default env-var restriction) originated
// in moshfeu/my-openclaw's eslint.config.js; see
// https://github.com/moshfeu/dev-toolkit/blob/main/docs/pii-and-logging.md
// and the repo's own docs for the rationale ("a check over a claim": a
// lint rule enforces "only config.ts reads process.env" instead of that
// being a comment someone can silently violate).
//
// Usage in a consumer repo's eslint.config.js:
//
//   import sharedConfig from '@moshfeu/eslint-config';
//
//   export default [
//     ...sharedConfig({
//       // Path(s) allowed to read process.env directly. Omit or pass
//       // `false` to skip the restriction entirely (e.g. a repo with no
//       // single config module yet).
//       configFiles: ['src/lib/config.ts', 'src/lib/config.js'],
//       // Extra file globs to exempt from the same rule (test fixtures
//       // that legitimately set process.env.* for mocking). Test files
//       // matching **/*.test.{js,ts} and test-setup.{js,ts} are exempt
//       // by default.
//       extraEnvExemptFiles: [],
//       ignores: ['node_modules/**', 'dist/**'],
//     }),
//     // ...repo-specific overrides
//   ];
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
