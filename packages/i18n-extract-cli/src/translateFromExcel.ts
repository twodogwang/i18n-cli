import fs from 'fs-extra'
import type { StringObject } from '../types'
import { getAbsolutePath } from './utils/getAbsolutePath'
import log from './utils/log'
import getLang from './utils/getLang'
import { saveLocaleFile } from './utils/saveLocaleFile'
import { flatObjectDeep } from './utils/flatObjectDeep'
import { spreadObject } from './utils/spreadObject'
import { readExcelTranslations, backfillExcelKeys } from './utils/excelUtil'

interface TranslateFromExcelOptions {
  excelPath: string
  backfillExcel: boolean
  localeFileType: string
}

/**
 * 从 Excel 文件读取翻译并生成语言包
 */
export default async function translateFromExcel(
  localePath: string,
  locales: string[],
  oldPrimaryLang: StringObject,
  options: TranslateFromExcelOptions
): Promise<void> {
  const { excelPath, backfillExcel, localeFileType } = options

  log.info('正在从 Excel 读取翻译...')

  // 1. 读取 Excel 翻译
  let excelLocales: string[]
  let excelTranslations: Map<string, Record<string, string>>

  try {
    const result = readExcelTranslations(excelPath)
    excelLocales = result.locales
    excelTranslations = result.translations
  } catch (error: any) {
    log.error(`读取 Excel 文件失败: ${error.message}`)
    log.info(`提示: 请确保 Excel 文件存在，或设置 translateFromExcel: false 使用 API 翻译`)
    process.exit(1)
  }

  // 2. 读取新提取的中文语言包
  const primaryLangPath = getAbsolutePath(process.cwd(), localePath)
  const primaryLangContent = getLang(primaryLangPath)

  // 检查主语言包是否已经通过 adjustKeyMap 调整为嵌套结构
  // 如果是嵌套结构（如 { zh: {}, en-US: {...} }），需要提取实际的中文 keys
  let newPrimaryLang: Record<string, string>
  const primaryLangKeys = Object.keys(primaryLangContent)

  // 判断是否为嵌套的语言包结构（包含语言代码作为顶层 key）
  const isNestedStructure = primaryLangKeys.some(
    (key) => locales.includes(key) || key === 'zh' || key === 'zh-CN'
  )

  if (isNestedStructure) {
    // 从嵌套结构中提取中文 keys（通常在某个语言命名空间下）
    // 优先从配置的第一个目标语言中提取
    const targetLangKey = locales[0]
    const targetLangContent = primaryLangContent[targetLangKey]
    if (targetLangContent && typeof targetLangContent === 'object') {
      newPrimaryLang = flatObjectDeep(targetLangContent as StringObject)
    } else {
      // 如果目标语言不存在，尝试从其他字段提取
      const firstNonEmptyKey = primaryLangKeys.find((key) => {
        const value = primaryLangContent[key]
        return value && typeof value === 'object' && Object.keys(value).length > 0
      })
      if (firstNonEmptyKey) {
        const content = primaryLangContent[firstNonEmptyKey]
        newPrimaryLang = typeof content === 'object' ? flatObjectDeep(content as StringObject) : {}
      } else {
        newPrimaryLang = {}
      }
    }
  } else {
    // 扁平结构，直接使用
    newPrimaryLang = flatObjectDeep(primaryLangContent)
  }

  const newKeys = Object.keys(newPrimaryLang)

  // 3. 检查 Excel 中的语言是否包含配置的目标语言
  const missingLocales = locales.filter((locale) => !excelLocales.includes(locale))
  if (missingLocales.length > 0) {
    log.warning(`Excel 中缺少以下语言列: ${missingLocales.join(', ')}`)
    log.warning(`这些语言将不会生成翻译`)
    log.info(`Excel 中可用的语言: ${excelLocales.join(', ')}`)
  }

  // 4. 收集需要回填的新 key
  const keysToBackfill: string[] = []

  // 5. 为每个目标语言生成翻译
  for (const targetLocale of locales) {
    if (!excelLocales.includes(targetLocale)) {
      continue // 跳过 Excel 中不存在的语言
    }

    log.info(`正在处理 ${targetLocale} 语言包`)

    const excelTranslation = excelTranslations.get(targetLocale)
    if (!excelTranslation) {
      log.warning(`Excel 中未找到 ${targetLocale} 的翻译数据`)
      continue
    }
    const reg = new RegExp(`/[A-Za-z-]+.${localeFileType}`, 'g')
    const targetPath = localePath.replace(reg, `/${targetLocale}.${localeFileType}`)
    const targetLocalePath = getAbsolutePath(process.cwd(), targetPath)

    // 读取旧的目标语言包（用于增量翻译）
    let oldTargetLangPack: Record<string, string> = {}
    if (fs.existsSync(targetLocalePath)) {
      oldTargetLangPack = flatObjectDeep(getLang(targetLocalePath))
    } else {
      saveLocaleFile({}, targetLocalePath)
    }

    // 构建新的翻译结果
    const newTargetLangPack: Record<string, string> = {}

    for (const key of newKeys) {
      // 增量翻译逻辑：如果主语言的 value 没变，复用旧翻译
      const oldLang = flatObjectDeep(oldPrimaryLang)
      const isNotChanged = oldLang[key] === newPrimaryLang[key]

      if (isNotChanged && oldTargetLangPack[key]) {
        // 复用旧翻译
        newTargetLangPack[key] = oldTargetLangPack[key]
      } else if (key in excelTranslation) {
        // 从 Excel 读取翻译
        const translation = excelTranslation[key]
        if (translation) {
          // 翻译存在且不为空
          newTargetLangPack[key] = translation
        } else {
          // 翻译为空，保持为空（不处理）
          newTargetLangPack[key] = ''
        }
      } else {
        // key 在 Excel 中不存在，标记为需要回填
        if (targetLocale === locales[0] && !keysToBackfill.includes(key)) {
          keysToBackfill.push(key)
        }
        // 暂时设为空字符串
        newTargetLangPack[key] = ''
      }
    }

    // 保存翻译结果
    const fileContent = spreadObject(newTargetLangPack)
    saveLocaleFile(fileContent, targetLocalePath)
    log.success(`完成 ${targetLocale} 语言包处理`)
  }

  // 6. 回填新 key 到 Excel
  if (backfillExcel && keysToBackfill.length > 0) {
    log.info(`正在回填 ${keysToBackfill.length} 个新 key 到 Excel...`)
    try {
      backfillExcelKeys(excelPath, keysToBackfill, newPrimaryLang)
      log.success(`成功回填 ${keysToBackfill.length} 个新 key 到 Excel`)
      log.info(`请手动翻译这些新 key: ${excelPath}`)
    } catch (error: any) {
      log.error(`回填 Excel 失败: ${error.message}`)
      log.warning(`翻译已完成，但新 key 未能写入 Excel，请手动添加`)
    }
  } else if (keysToBackfill.length > 0) {
    log.warning(`发现 ${keysToBackfill.length} 个新 key，但未启用回填功能`)
    log.info(`新 key 列表: ${keysToBackfill.join(', ')}`)
  }
}
