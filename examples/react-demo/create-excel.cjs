// 创建测试用的 Excel 翻译文件
const xlsx = require('../../packages/i18n-extract-cli/node_modules/node-xlsx').default
const fs = require('fs')

const data = [
  ['字典key', 'zh-CN', 'en-US', 'ja-JP'],
  // 这里可以添加一些预设的翻译，或者留空让工具自动回填
  ['示例', '示例', 'Example', '例'],
]

const buffer = xlsx.build([{ name: 'Sheet1', data }])
fs.writeFileSync('./locales.xlsx', buffer)
console.log('✅ 已创建 Excel 翻译文件: locales.xlsx')
