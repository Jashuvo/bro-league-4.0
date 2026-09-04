import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Plain ESLint 8 flat config (no `eslint/config` helpers — those
// (`defineConfig`, `globalIgnores`, nested `extends`) only exist on
// ESLint 9+, but this project pins ESLint 8.x). Each shared config is
// spread into its own object with `files` re-applied so the scoping
// matches what the nested-`extends` shorthand used to express.
//
// `eslint-plugin-react` was an installed dependency that eslint.config.js
// never actually imported — without its `react/jsx-uses-vars` rule, plain
// `no-unused-vars` doesn't know a JSX tag like `<motion.div>` counts as a
// use of `motion`, and flags it as unused everywhere. That's why it's here.
const jsAndJsxFiles = ['**/*.{js,jsx}']

export default [
  // `.claude` covers this tool's own worktrees (temporary git checkouts for
  // background agent sessions) — those are full copies of the repo,
  // `dist` included, and without this `npm run lint` picks up hundreds of
  // errors from old build output that isn't even this checkout's code.
  { ignores: ['dist', 'node_modules', '.claude', '.vercel'] },
  { files: jsAndJsxFiles, ...js.configs.recommended },
  { files: jsAndJsxFiles, ...react.configs.flat.recommended },
  { files: jsAndJsxFiles, ...react.configs.flat['jsx-runtime'] },
  { files: jsAndJsxFiles, ...reactHooks.configs['recommended-latest'] },
  { files: jsAndJsxFiles, ...reactRefresh.configs.vite },
  {
    files: jsAndJsxFiles,
    settings: {
      react: { version: 'detect' },
    },
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // react/prop-types would flag every prop in this JS (non-TS) codebase
      // — it was never enforced here and turning it on now is out of scope.
      'react/prop-types': 'off',
    },
  },
  {
    // Vercel serverless functions, local scripts, and root tooling configs
    // run in Node, not the browser — they need `process`/`require`/etc,
    // which `globals.browser` above doesn't provide.
    files: ['api/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
