module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: { version: '18.2' },
  },
  plugins: ['react-refresh'],
  rules: {
    // This is a JS project — prop-types are redundant boilerplate with our hook patterns
    'react/prop-types': 'off',
    // Allow fast-refresh only exports
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Warn on unused vars but allow underscore-prefixed ones
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // react-hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Allow console.warn/error in production (used for non-critical AI fallbacks)
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // Disable entity escaping — we intentionally use ' in JSX
    'react/no-unescaped-entities': 'off',
  },
};
