import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * eslint-config-next 16 ships flat config arrays, so they are spread directly.
 * (Going through `FlatCompat.extends()` — the eslintrc bridge — fails schema
 * validation against these, which is what broke `npm run lint`.)
 */
const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'autoroom-claude-kit/**'],
  },
  ...coreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // UI copy lives in messages/hy.json; unescaped apostrophes in JSX are not a
      // concern for Armenian text, but keep the rule on for accidental literals.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default eslintConfig;
