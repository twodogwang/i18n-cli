# 配置示例

## Vue 3 项目配置

```javascript
module.exports = {
  input: './src',
  localePath: './locales/zh-CN.json',
  locales: ['en', 'ja'],

  rules: {
    vue: {
      importDeclaration: 'import { useI18n } from "vue-i18n"',
      functionNameInTemplate: 't',
      functionNameInScript: 't',
      functionSnippets: 'const { t } = useI18n()',
      customizeKey(key) {
        return key
      },
    },
  },
}
```

## React 项目配置

```javascript
module.exports = {
  input: './src',
  localePath: './locales/zh-CN.json',

  rules: {
    jsx: {
      functionName: 't',
      importDeclaration: 'import { t } from "i18n"',
    },
  },
}
```

## Excel 翻译工作流配置

```javascript
module.exports = {
  input: './src',
  localePath: './locales/zh-CN.json',

  translateFromExcel: true,
  excelPath: './locales.xlsx',
  backfillExcel: true,

  mergeLocales: true,
}
```
