module.exports = {
  input: './src',
  localePath: './locales/lang.json',
  locales: ['en', 'zh'],

  // 使用 Excel 翻译功能
  translateFromExcel: true,
  excelPath: './locales.xlsx',
  backfillExcel: true,

  // 合并语言文件到一个文件中，生成 { zh: {}, en-US: {...} } 格式
  mergeLocales: true,

  rules: {
    vue: {
      // ========== 方式一：统一配置（setup 和 Options API 使用相同配置）==========
      // importDeclaration: 'import { useI18n } from "vue-i18n"',
      // functionNameInTemplate: 't',
      // functionNameInScript: 't',
      // functionSnippets: 'const { t } = useI18n()',
      // customizeKey(key) {
      //   return key
      // },

      // ========== 方式二：区分配置（setup 和 Options API 使用不同配置）==========

      // template 中的函数名（setup 和 Options API 共用）
      functionNameInTemplate: 't',

      // === setup 语法配置 ===
      functionNameInSetup: 't', // setup 中使用 t() 函数
      callerInSetup: '', // setup 中不需要调用者
      importDeclarationForSetup: 'import { useI18n } from "vue-i18n"',
      functionSnippetsForSetup: 'const { t } = useI18n()',

      // === Options API 配置 ===
      functionNameInOptionsAPI: '$t', // Options API 中使用 this.$t() 方法
      callerInOptionsAPI: 'this', // Options API 中使用 this 调用
      importDeclaration: '', // Options API 不需要 import（通过 Vue.use 全局注册）

      // 自定义 key：直接使用中文作为 key
      customizeKey(key) {
        return key
      },
    },
  },
}