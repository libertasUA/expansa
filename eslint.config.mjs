import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * A small rule set. Every rule below is here because it catches something we have
 * either agreed in writing or already got wrong — not because it appeared in a
 * recommended preset.
 *
 * Formatting is Prettier's job and no rule here has an opinion about it;
 * `eslint-config-prettier` last in the chain turns off anything that would.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'migrations/meta/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      // Type-aware linting, which is the reason ESLint was chosen over a
      // formatter-linter: no-floating-promises cannot be decided from syntax.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },

    plugins: { perfectionist },

    rules: {
      // Everything here is asynchronous and much of it runs inside a transaction.
      // A lost `await` is a defect, not an untidiness.
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          // node:test's describe and it return promises the runner awaits itself.
          // Narrowed to those calls rather than switching the rule off in tests,
          // where an unawaited assertion is precisely how a test passes by accident.
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['describe', 'it', 'test'] },
          ],
        },
      ],
      '@typescript-eslint/await-thenable': 'error',

      // CLAUDE.md: no `any`. `strict` catches most of it; this catches the rest.
      '@typescript-eslint/no-explicit-any': 'error',

      // Type-only imports are erased at compile time. Saying so explicitly keeps a
      // type import from dragging a module into a bundle that never needed it —
      // which matters for the packages that ship to a client.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // The import order recorded in CLAUDE.md, now checked rather than remembered.
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          newlinesBetween: 1,
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          internalPattern: ['^@expansa/.*'],
        },
      ],
    },
  },

  {
    // The third enforcement layer for contour boundaries, after pnpm's resolution
    // and TypeScript's project references. Transport must reach the platform
    // through a use case, or the claim that logic is detached from transport is
    // decoration.
    files: ['server/src/api/**/*.ts', 'server/src/jobs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@expansa/platform',
              message:
                'Transport holds no logic. Call a use case; it decides what the platform does.',
            },
          ],
          patterns: [
            {
              group: ['**/db/**', '**/*.repository'],
              message:
                'Transport holds no logic. Call a use case rather than reaching for storage.',
            },
          ],
        },
      ],
    },
  },

  {
    // Tests are excluded from a package's main tsconfig — they need @types/node and
    // the package it exercises must not have it — so the project service cannot find
    // them. Point at the test project instead, or type-aware rules go silent exactly
    // where an unawaited assertion makes a test pass by accident.
    files: ['**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['*/tsconfig.test.json', '*/*/tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    // Build and tooling scripts sit outside any tsconfig, so type-aware rules have
    // nothing to work from.
    files: ['**/*.js', '**/*.mjs', 'drizzle.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  {
    // Separate object on purpose: disableTypeChecked carries its own
    // languageOptions, and spreading it over these would drop the globals with no
    // sign that anything had happened.
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: globals.nodeBuiltin },
  },

  prettier,
);
