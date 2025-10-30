import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import pluginImport from 'eslint-plugin-import'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['.output/', '.wxt/', 'node_modules/'],
  },

  // TypeScript推奨ルール
  tseslint.configs.recommended,

  // 共通設定: JS/TS/Vue全般
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    plugins: { js, import: pluginImport, '@stylistic': stylistic },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // JSルール
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      'brace-style': ['error', 'stroustrup'],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-trailing-spaces': 'warn',
      quotes: ['error', 'single'],
      'function-paren-newline': ['error', 'consistent'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      semi: ['error', 'never', { beforeStatementContinuationChars: 'never' }],
      'semi-spacing': ['error', { after: true, before: false }],
      'semi-style': ['error', 'first'],
      'no-extra-semi': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'prefer-const': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',           // Node.js組み込みモジュール (例: 'fs', 'path')
            'external',          // 外部ライブラリ/npmパッケージ
            'internal',          // プロジェクト内の絶対パスインポート/エイリアス (例: '@/components')
            'parent',            // 親ディレクトリへの相対パス (例: '../')
            'sibling',           // 兄弟ファイルへの相対パス (例: './')
            'index',             // 同じディレクトリのindexファイル (例: './')
            'object',            // オブジェクトインポート (非推奨な場合あり)
          ],
          'newlines-between': 'always', // グループ間に空行を強制
          alphabetize: {
            order: 'asc',             // 各グループ内でアルファベット順にソート
            caseInsensitive: true,
            orderImportKind: 'desc', // 同じ
          },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'quote-props': ['error', 'as-needed'], //''で囲む必要のないプロパティは'を外す
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'none',    // すべての行で何もなし
            requireLast: true,    // 最終行のデリミタ（セミコロン、カンマ）を禁止
          },
          singleline: {
            delimiter: 'comma',
            requireLast: false,
          },
          // interface, type, class/interface/type literalなど、
          // 詳細な型定義の区切り文字をより細かく制御するためのオーバーライドも可能です。
          overrides: {
            interface: {
              multiline: {
                requireLast: false, // interfaceの最後のプロパティのセミコロンを禁止
              },
            },
          },
        },
      ],
    },
  },

  // Vue推奨ルール (Flat Config 対応)
  pluginVue.configs['flat/recommended'],

  // Vueファイル専用のparser設定
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      //
      // Vueカスタムルール
      'vue/no-root-v-if': 'warn',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/no-parsing-error': 'off',
      'vue/block-tag-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/no-irregular-whitespace': 'error',
      'vue/require-default-prop': 'warn',
      'vue/html-indent': 'off',
      'vue/multiline-html-element-content-newline': 0,
      'vue/html-closing-bracket-newline': 0,
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/static-class-names-order': 'error',
    },
  },
])
