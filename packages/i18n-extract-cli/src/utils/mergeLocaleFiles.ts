import fs from 'fs-extra'
import type { StringObject } from '../../types'
import { getAbsolutePath } from './getAbsolutePath'
import getLang from './getLang'
import { saveLocaleFile } from './saveLocaleFile'
import log from './log'

/**
 * 合并所有语言文件到主语言包文件中
 * 生成格式：{ zh: {}, en-US: {...}, ... }
 * @param localePath 主语言包路径
 * @param locales 目标语言列表
 * @param localeFileType 语言包文件类型
 */
export function mergeLocaleFiles(
  localePath: string,
  locales: string[],
  localeFileType: string
): void {
  log.info('正在合并语言文件...')

  const primaryLangPath = getAbsolutePath(process.cwd(), localePath)

  // 构建合并后的语言包对象
  const mergedLocales: StringObject = {
    zh: {}, // 中文不需要映射，直接使用中文作为 key
  }

  // 读取并合并所有目标语言文件
  const reg = new RegExp(`/[A-Za-z-]+\\.${localeFileType}`, 'g')

  for (const locale of locales) {
    const targetPath = localePath.replace(reg, `/${locale}.${localeFileType}`)
    const targetLocalePath = getAbsolutePath(process.cwd(), targetPath)

    if (fs.existsSync(targetLocalePath)) {
      const targetLang = getLang(targetLocalePath)
      mergedLocales[locale] = targetLang
      log.verbose(`合并 ${locale} 语言包`)

      // 删除独立的语言文件
      fs.unlinkSync(targetLocalePath)
      log.verbose(`删除独立文件: ${targetLocalePath}`)
    } else {
      log.warning(`目标语言文件不存在: ${targetPath}`)
      // 如果文件不存在，创建空对象
      mergedLocales[locale] = {}
    }
  }

  // 删除主语言包文件（如果存在）
  if (fs.existsSync(primaryLangPath)) {
    fs.unlinkSync(primaryLangPath)
    log.verbose(`删除主语言包文件: ${primaryLangPath}`)
  }

  // 生成新的合并文件路径（使用 index.json）
  const mergedPath = localePath.replace(reg, `/index.${localeFileType}`)
  const mergedAbsolutePath = getAbsolutePath(process.cwd(), mergedPath)

  // 保存合并后的语言包
  saveLocaleFile(mergedLocales, mergedAbsolutePath)
  log.success(`语言文件已合并到: ${mergedPath}`)
  log.info(`包含语言: ${Object.keys(mergedLocales).join(', ')}`)
}
