import xlsx from 'node-xlsx'
import fs from 'fs-extra'
import StateManager from './stateManager'
import { getAbsolutePath } from './getAbsolutePath'

export function getExcelHeader(): string[] {
  const { locales } = StateManager.getToolConfig()
  const header = ['字典key', 'zh-CN']
  for (const locale of locales) {
    header.push(locale)
  }
  return header
}

export function buildExcel(headers: string[], data: string[][], name: string): Buffer {
  const sheetOptions: Record<string, any> = {}
  sheetOptions['!cols'] = []
  headers.forEach(() => {
    sheetOptions['!cols'].push({
      wch: 50, // 表格列宽
    })
  })

  data.unshift(headers)
  const buffer = xlsx.build([{ options: {}, name, data }], { sheetOptions })
  return buffer
}

/**
 * 读取 Excel 文件并解析为语言包映射
 * @param excelPath Excel 文件路径
 * @returns {
 *   locales: ['en-US', 'ja-JP', ...],
 *   translations: Map {
 *     'en-US' => { 'common.hello': 'Hello', ... },
 *     'ja-JP' => { 'common.hello': 'こんにちは', ... }
 *   }
 * }
 */
export function readExcelTranslations(excelPath: string): {
  locales: string[]
  translations: Map<string, Record<string, string>>
} {
  const absolutePath = getAbsolutePath(process.cwd(), excelPath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Excel 文件不存在: ${excelPath}`)
  }

  const xlsxData = xlsx.parse(absolutePath)[0].data as string[][]

  if (xlsxData.length === 0) {
    throw new Error(`Excel 文件为空: ${excelPath}`)
  }

  // 第一行是表头: ['字典key', 'zh-CN', 'en-US', ...]
  const headers = xlsxData[0]
  if (headers.length < 3) {
    throw new Error(`Excel 格式错误，至少需要 3 列（字典key, zh-CN, 目标语言）`)
  }

  // 提取语言列表（跳过第一列 key 和第二列 zh-CN）
  const locales = headers.slice(2)

  // 初始化翻译映射
  const translations = new Map<string, Record<string, string>>()
  locales.forEach((locale) => {
    translations.set(locale, {})
  })

  // 遍历数据行（跳过表头）
  const rows = xlsxData.slice(1)
  rows.forEach((row) => {
    const key = row[0]
    if (!key) return // 跳过空 key

    // 遍历每个语言列
    locales.forEach((locale, index) => {
      const value = row[index + 2] || '' // +2 因为跳过了 key 和 zh-CN 列
      const localeMap = translations.get(locale)
      if (localeMap) {
        localeMap[key] = value
      }
    })
  })

  return { locales, translations }
}

/**
 * 回填新 key 到 Excel 文件
 * @param excelPath Excel 文件路径
 * @param newKeys 需要回填的新 key 列表
 * @param zhCNValues 中文语言包的键值对
 */
export function backfillExcelKeys(
  excelPath: string,
  newKeys: string[],
  zhCNValues: Record<string, string>
): void {
  if (newKeys.length === 0) {
    return // 没有新 key，无需回填
  }

  const absolutePath = getAbsolutePath(process.cwd(), excelPath)
  const xlsxData = xlsx.parse(absolutePath)[0].data as string[][]

  const headers = xlsxData[0]
  const locales = headers.slice(2)

  // 追加新行
  newKeys.forEach((key) => {
    const newRow = [key, zhCNValues[key]]
    // 为每个目标语言添加空字符串
    locales.forEach(() => {
      newRow.push('')
    })
    xlsxData.push(newRow)
  })

  // 写回 Excel
  const buffer = buildExcel(headers, xlsxData.slice(1), 'Sheet1')
  const excelData = new Uint8Array(buffer, buffer.byteOffset, buffer.length)
  fs.writeFileSync(absolutePath, excelData, 'utf8')
}
