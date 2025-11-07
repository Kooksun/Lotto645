import { fileURLToPath } from 'node:url';
import path from 'node:path';
import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
const tsRecommendedConfigs = tsPlugin.configs['flat/recommended'];

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      'tests/e2e/.playwright',
      '**/*.d.ts'
    ]
  },
  js.configs.recommended,
  ...tsRecommendedConfigs,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' }
      ],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off'
    }
  }
];
