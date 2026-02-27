module.exports = {
  input: './src',
  localePath: './locales/lang.json',
  locales: ['en','zh'],

  // 使用 Excel 翻译功能
  translateFromExcel: true,
  excelPath: './locales.xlsx',
  backfillExcel: true,

  // 合并语言文件到一个文件中，生成 { zh: {}, en-US: {...} } 格式
  mergeLocales: true,

  rules: {
    vue: {
      importDeclaration: 'import { useI18n } from "vue-i18n"',
      // setup 语法中，template 使用 t 函数
      functionNameInTemplate: 't',
      // setup 语法中，script 使用 t 函数
      functionNameInScript: 't',
      // 在 setup 中需要先调用 useI18n() 获取 t 函数
      functionSnippets: 'const { t } = useI18n()',
      // 自定义 key：直接使用中文作为 key
      customizeKey(key) {
        return key
      },
    },
  },
}
