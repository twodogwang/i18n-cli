// 创建测试用的 Excel 翻译文件
const xlsx = require('../../packages/i18n-extract-cli/node_modules/node-xlsx').default
const fs = require('fs')
const path = require('path')

// 尝试读取语言包文件
let zhCN = {}
const zhCNPath = path.join(__dirname, 'locales/zh-CN.json')
const indexPath = path.join(__dirname, 'locales/index.json')

if (fs.existsSync(indexPath)) {
  // 如果存在 index.json，从中提取中文 keys
  const indexContent = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  // 从 en-US 字段中提取 keys（因为 key 就是中文）
  if (indexContent['en-US']) {
    Object.keys(indexContent['en-US']).forEach(key => {
      zhCN[key] = key
    })
  }
} else if (fs.existsSync(zhCNPath)) {
  // 如果存在 zh-CN.json，直接读取
  zhCN = JSON.parse(fs.readFileSync(zhCNPath, 'utf-8'))
} else {
  // 如果都不存在，使用默认数据
  zhCN = {
    '传入的内容': '传入的内容',
    '---组合': '---组合',
    '数量为 ': '数量为 ',
    '标题': '标题',
    '测试项目': '测试项目',
    '点击切换语言': '点击切换语言'
  }
}

// 准备 Excel 数据
const data = [
  ['字典key', 'zh-CN', 'en-US']
]

// 简单的翻译映射（用于测试）
const translations = {
  '传入的内容': 'Passed Content',
  '---组合': '---Composition',
  '数量为 ': 'Count is ',
  '标题': 'Title',
  '测试项目': 'Test Project',
  '点击切换语言': 'Click to Switch Language'
}

// 添加所有翻译数据
Object.keys(zhCN).forEach((key) => {
  const zhText = zhCN[key]
  const enText = translations[zhText] || ''
  data.push([key, zhText, enText])
})

// 设置列宽
const sheetOptions = {
  '!cols': [
    { wch: 30 }, // 字典key
    { wch: 30 }, // zh-CN
    { wch: 30 }  // en-US
  ]
}

const buffer = xlsx.build([{ name: 'Sheet1', data }], { sheetOptions })
fs.writeFileSync('./locales.xlsx', buffer)
console.log(`✅ 已创建 Excel 翻译文件: locales.xlsx`)
console.log(`📊 包含 ${Object.keys(zhCN).length} 条翻译`)

