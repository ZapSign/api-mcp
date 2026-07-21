import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-else-return': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'SwitchStatement', message: 'Use object maps (Record<string, handler>) instead of switch.' },
        { selector: 'TSEnumDeclaration', message: 'Use as const objects instead of TypeScript enums.' },
      ],
      'max-depth': ['error', 2],
      'complexity': ['error', 10],
      'prefer-const': 'error',
    },
  },
];
