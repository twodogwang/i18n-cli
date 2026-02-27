# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 i18n 国际化命令行工具的 monorepo 项目，支持自动将代码中的中文提取并替换为 i18n 标记，并支持自动翻译功能。支持 Vue2、Vue3 和 React 项目。

**环境要求**：

- Node.js >= 14.21.2（推荐 >= 16）
- pnpm >= 7（必须使用 pnpm，不支持 npm/yarn）

## 技术栈

- **包管理**: pnpm (workspace)
- **构建工具**: turbo (monorepo 构建)
- **语言**: TypeScript
- **代码质量**: ESLint + Prettier + Husky + lint-staged
- **版本管理**: Changesets
- **AST 处理**: Babel (用于 JS/TS/JSX/TSX)、@vue/compiler-sfc (用于 Vue)

## 常用命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式（使用 unbuild --stub 实现实时编译）
pnpm dev

# 构建所有包（使用 unbuild）
pnpm build

# 类型检查（不生成文件）
cd packages/i18n-extract-cli && pnpm check

# 在示例项目中测试 CLI
cd examples/react-demo && pnpm i18n
cd examples/vue-demo && pnpm i18n

# 添加 changeset（用于版本管理）
pnpm changeset-add

# 更新包版本
pnpm version-packages

# 发布包
pnpm release

# 提交代码（使用 commitizen）
pnpm cz
```

## 项目结构

```
i18n-cli/
├── packages/
│   ├── i18n-extract-cli/          # 主要的 CLI 工具包
│   │   ├── bin/index.js           # CLI 入口
│   │   ├── build.config.ts        # unbuild 构建配置
│   │   ├── src/
│   │   │   ├── index.ts           # 主入口，处理命令行参数
│   │   │   ├── core.ts            # 核心逻辑，协调整个提取流程
│   │   │   ├── parse.ts           # 解析文件，识别中文
│   │   │   ├── transform.ts       # 转换文件的入口
│   │   │   ├── transformJs.ts    # 处理 JS/TS/JSX/TSX 文件的 AST 转换
│   │   │   ├── transformVue.ts   # 处理 Vue 文件的 AST 转换
│   │   │   ├── collector.ts      # 收集提取的中文，生成语言包
│   │   │   ├── translate.ts      # 调用翻译 API
│   │   │   ├── translateFromExcel.ts  # 从 Excel 读取翻译
│   │   │   ├── exportExcel.ts    # 导出 Excel 功能
│   │   │   ├── utils/
│   │   │   │   └── excelUtil.ts  # Excel 读写工具
│   │   │   └── commands/         # 子命令
│   │   │       ├── init/         # 初始化配置文件
│   │   │       └── loadExcel/    # 从 Excel 导入语言包
│   │   └── package.json
│   └── translate-utils/           # 翻译工具包
│       ├── build.config.ts        # unbuild 构建配置
│       ├── src/
│       │   ├── index.ts
│       │   ├── google.ts         # Google 翻译
│       │   ├── baidu.ts          # 百度翻译
│       │   ├── youdao.ts         # 有道翻译
│       │   └── alicloud.ts       # 阿里云翻译
│       └── package.json
├── examples/                      # 示例项目（已加入 workspace）
│   ├── react-demo/
│   └── vue-demo/
└── package.json                   # 根 package.json
```

## 核心架构

### 1. 代码转换流程

整个工具的核心流程在 `core.ts` 中协调：

1. **解析阶段** (`parse.ts`): 使用 glob 匹配文件，读取源代码
2. **转换阶段** (`transform.ts` → `transformJs.ts` / `transformVue.ts`):
   - 使用 Babel 解析 JS/TS/JSX/TSX 文件为 AST
   - 使用 @vue/compiler-sfc 解析 Vue 文件
   - 遍历 AST，识别中文字符串
   - 将中文替换为 i18n 函数调用（如 `t('中文')` 或 `$t('中文')`）
   - 自动插入 import 语句
3. **收集阶段** (`collector.ts`): 将提取的中文 key-value 写入语言包 JSON 文件
4. **翻译阶段** (`translate.ts`): 调用翻译 API 生成其他语言的语言包

### 2. AST 转换关键点

- **JS/TS/JSX/TSX**: 使用 Babel 的 visitor 模式遍历 AST，处理字符串字面量、模板字符串、JSX 文本等
- **Vue**: 分别处理 template、script、style 三个部分，template 使用 htmlparser2 解析

### 3. 配置系统

- 支持命令行参数和配置文件 (`i18n.config.js`)
- 配置文件优先级高于命令行参数
- 可以为不同文件类型（js/ts/jsx/tsx/vue）配置不同的转换规则

### 4. 翻译功能

工具支持两种翻译方式：

**API 翻译** (`translate.ts`)：

- Google Translate
- 百度翻译
- 有道翻译
- 阿里云机器翻译

**Excel 翻译** (`translateFromExcel.ts`)：

- 从 Excel 文件读取已有的人工翻译
- 支持自动回填新 key 到 Excel
- 适用于已有翻译资源的场景
- 配置项：`translateFromExcel`、`excelPath`、`backfillExcel`

**Excel 翻译工作流程**：

1. 首次运行时，工具会提取中文并生成语言包
2. 使用 `exportExcel` 功能将语言包导出为 Excel 文件
3. 人工翻译 Excel 文件中的内容
4. 配置 `translateFromExcel: true` 和 `excelPath`，再次运行工具
5. 工具会从 Excel 读取翻译，更新语言包
6. 如果有新增的 key，设置 `backfillExcel: true` 可以自动回填到 Excel

## 开发注意事项

### 构建系统

- 项目使用 turbo 进行 monorepo 构建，构建顺序由依赖关系自动确定
- 使用 unbuild 作为构建工具（替代了 tsc），每个包都会构建 CJS 和 ESM 两种格式
- 开发模式下使用 `unbuild --stub` 实现实时编译（无需重启）
- 构建输出目录为 `dist/`，包含 `dist/index.cjs` 和 `dist/index.mjs`

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 提交前会自动运行 lint-staged 检查
- 提交信息需符合 conventional commits 规范（通过 commitlint 检查）

### 版本发布

- 使用 Changesets 管理版本和 changelog
- 发布流程：`pnpm changeset-add` → `pnpm version-packages` → `pnpm release`

### 测试

- 项目在 `examples/` 目录下提供了 React 和 Vue 的示例项目
- 可以在示例项目中测试 CLI 工具的功能
- 没有单独的单元测试，主要通过示例项目进行集成测试

### 调试

在开发模式下调试 CLI 工具：

1. **启动开发模式**：在根目录运行 `pnpm dev`，这会启动 unbuild 的 stub 模式，实现实时编译
2. **在示例项目中测试**：
   ```bash
   cd examples/vue-demo
   pnpm i18n  # 会使用本地开发中的 CLI 工具
   ```
3. **查看生成的文件**：检查 `examples/vue-demo/locales/` 目录下的语言包文件
4. **修改代码后无需重启**：unbuild stub 模式会自动重新编译，直接再次运行 `pnpm i18n` 即可

## 特殊处理

1. **忽略提取**: 使用 `/*i18n-ignore*/` 注释可以忽略下一行的中文提取
2. **自定义 key**: 通过配置的 `customizeKey` 函数可以自定义生成的 key
3. **增量模式**: 支持将新提取的中文追加到已有语言包中
4. **Prettier 集成**: 转换后的代码会自动使用 Prettier 格式化

## 依赖关系

- `i18n-extract-cli` 依赖 `translate-utils`
- 两个包都是独立发布到 npm 的公共包
- `examples/` 目录下的示例项目已加入 workspace，使用 `workspace:*` 依赖本地包

## CLI 命令

工具提供以下命令：

```bash
# 主命令：提取中文并替换为 i18n 标记
it [options]
i18n-extract [options]

# 初始化配置文件
it init

# 从 Excel 导入语言包
it loadExcel
```

常用选项：

- `-c, --config <path>`: 指定配置文件路径（默认 `i18n.config.js`）
- `-i, --input <path>`: 指定输入目录或文件
- `-l, --localePath <path>`: 指定语言包输出路径
- `--skip-extract`: 跳过提取，仅翻译
- `--skip-translate`: 跳过翻译，仅提取
