import typescriptEslint from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'prettier',
        'plugin:prettier/recommended',
    ),
    eslintConfigPrettier,
    {
        ignores: ['dist/**/**.js', 'dist/**/**.d.ts', 'src/models'],
    },
    {
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },

            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: 'module',
        },
        rules: {
            '@typescript-eslint/no-dynamic-delete': 'error',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'off',

            indent: [
                'error',
                4,
                {
                    SwitchCase: 1,
                },
            ],

            'linebreak-style': ['error', 'unix'],

            'comma-spacing': [
                'error',
                {
                    before: false,
                    after: true,
                },
            ],

            'no-multi-spaces': 2,
            'no-trailing-spaces': 2,

            quotes: [
                'error',
                'single',
                {
                    allowTemplateLiterals: true,
                },
            ],

            'one-var': ['error', 'never'],
            'no-unreachable': 'error',
            'no-unused-vars': 'off',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],

            'no-return-await': 'error',
            'no-eq-null': 'error',
            eqeqeq: 'error',
            'no-else-return': 'error',
            'no-self-compare': 'error',
            'max-params': ['error', 4],
            'default-param-last': ['error'],
            'no-delete-var': 'error',
        },
    },
];
