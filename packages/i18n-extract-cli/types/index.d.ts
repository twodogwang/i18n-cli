import type { ParseResult } from '@babel/core'
import type { Options } from 'prettier'

export type deepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? deepPartial<T[K]> : T[K]
}

export interface GlobalRule {
  ignoreMethods: string[]
}

export interface transformOptions {
  rule: Rule
  parse: (code: string) => ParseResult
  isJsInVue?: boolean
  isVueSetup?: boolean
  filePath?: string
}

export type CustomizeKey = (key: string, path?: string) => string

export type GetCustomSlot = (slotValue: string) => string

export interface Rule {
  caller: string
  functionName?: string
  importDeclaration: string
  customizeKey: CustomizeKey
  customSlot: GetCustomSlot
  // TODO: 可优化成根据范型动态生成规则
  functionSnippets?: string
  forceImport?: boolean
  functionNameInTemplate?: string
  functionNameInScript?: string
  // Vue setup 和 Options API 区分配置
  functionNameInSetup?: string // setup 语法中的函数名，如 't'
  functionNameInOptionsAPI?: string // Options API 中的函数名，如 '$t'
  callerInSetup?: string // setup 语法中的调用者，通常为空
  callerInOptionsAPI?: string // Options API 中的调用者，如 'this'
  importDeclarationForSetup?: string // setup 语法的 import 语句
  functionSnippetsForSetup?: string // setup 语法的函数声明
}

export type Rules = {
  [k in keyof Config['rules']]: Config['rules'][k]
}

export type FileExtension = 'js' | 'ts' | 'cjs' | 'mjs' | 'jsx' | 'tsx' | 'vue'

export type StringObject = {
  [key: string]: string | StringObject
}

export type AdjustKeyMap = (
  allKeyValue: StringObject,
  currentPathKeyValue: Record<string, string>,
  path
) => StringObject

export interface YoudaoConfig {
  key?: string
  secret?: string
}

export interface BaiduConfig {
  key?: string
  secret?: string
}

interface AlicloudConfig {
  key?: string
  secret?: string
}

export type translatorType = 'google' | 'youdao' | 'baidu' | 'alicloud'
export interface TranslateConfig {
  translator?: translatorType
  google?: {
    proxy?: string
  }
  youdao?: YoudaoConfig
  baidu?: BaiduConfig
  alicloud?: AlicloudConfig
  translationTextMaxLength?: number
}

export type PrettierConfig = Options | boolean

export type TagOrder = Array<'template' | 'script' | 'style'>

export type Config = {
  input: string
  output: string
  localePath: string
  localeFileType: string
  locales: string[]
  exclude: string[]
  rules: {
    js: Rule
    ts: Rule
    cjs: Rule
    mjs: Rule
    tsx: Rule & {
      functionSnippets: string
    }
    jsx: Rule & {
      functionSnippets: string
    }
    vue: Rule & {
      tagOrder: TagOrder
    }
  }
  prettier: PrettierConfig
  skipExtract: boolean
  skipTranslate: boolean
  translateFromExcel: boolean
  backfillExcel: boolean
  translationTextMaxLength: number
  incremental: boolean
  globalRule: GlobalRule
  excelPath: string
  exportExcel: boolean
  mergeLocales: boolean
  adjustKeyMap?: AdjustKeyMap
} & TranslateConfig

export interface CommandOptions {
  input?: string
  output?: string
  localePath?: string
  configFile?: string
  locales?: string[]
  verbose?: boolean
  skipExtract?: boolean
  skipTranslate?: boolean
  translateFromExcel?: boolean
  backfillExcel?: boolean
  excelPath?: string
  exportExcel?: boolean
}
