module.exports = {
  input: './src',
  localePath: './src/locales/zh-CN.json',
  locales: ['en-US', 'ja-JP'],

  // 使用 Excel 翻译功能
  translateFromExcel: true,
  excelPath: './locales.xlsx',
  backfillExcel: true,

  rules: {
    tsx: {
      importDeclaration: 'import { t } from "@/utils/i18n"',
    },
  },
};
