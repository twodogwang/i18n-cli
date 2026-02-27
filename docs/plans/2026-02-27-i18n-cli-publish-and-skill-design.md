# i18n-cli 发布和 Skill 设计方案

**日期**: 2026-02-27
**状态**: 已批准
**目标**: 将 i18n-cli 工具发布到 npm，并创建 Claude Code skill 支持全场景使用

## 项目背景

这是一个 fork 的 i18n 国际化命令行工具 monorepo 项目，需要：

1. 以 `@bakarhythm` 作用域发布到 npm（团队私有使用）
2. 创建 Claude Code skill，支持初始化、增量提取、Excel 翻译等全场景
3. 使用 vitest 搭建测试框架，替代手动测试流程

## 整体架构

### 项目结构

```
i18n-cli/
├── packages/
│   ├── i18n-extract-cli/          # 主 CLI 工具（发布到 npm）
│   │   ├── src/
│   │   ├── test/                  # 该包的测试
│   │   │   ├── unit/              # 单元测试
│   │   │   ├── integration/       # 集成测试
│   │   │   ├── fixtures/          # 测试固件
│   │   │   └── helpers/           # 测试工具
│   │   ├── build.config.ts
│   │   └── package.json
│   └── translate-utils/           # 翻译工具（发布到 npm）
│       ├── src/
│       ├── test/                  # 该包的测试
│       ├── build.config.ts
│       └── package.json
├── examples/                      # 示例项目
│   ├── react-demo/
│   └── vue-demo/
├── skills/                        # Claude skills
│   └── i18n-extract/              # skill 独立目录
│       ├── skill.md               # skill 主文件
│       ├── references/            # 参考文档
│       │   ├── README.md
│       │   ├── config-examples.md
│       │   └── troubleshooting.md
│       └── scripts/               # 辅助脚本（可选）
├── docs/
│   └── plans/                     # 设计文档
├── vitest.config.ts               # 根目录 vitest 配置
└── package.json
```

### 关键设计决策

1. **测试放在各自包内**：每个包独立测试，符合标准 monorepo 实践
2. **Skill 独立管理**：不发布到 npm，通过 git 或手动安装到 `~/.claude/skills/`
3. **Skill 调用 npm 包**：解耦工具和使用手册，独立更新

## 第一部分：测试架构

### Vitest 配置

**根目录 vitest.config.ts**：

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**'],
    },
  },
})
```

**包级别配置**（packages/i18n-extract-cli/vitest.config.ts）：

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
```

### 测试目录结构

```
packages/i18n-extract-cli/test/
├── unit/                          # 单元测试
│   ├── transformJs.test.ts       # JS/TS 转换测试
│   ├── transformVue.test.ts      # Vue 转换测试
│   ├── collector.test.ts         # 语言包收集测试
│   └── translate.test.ts         # 翻译功能测试
├── integration/                   # 集成测试
│   ├── extract-flow.test.ts      # 完整提取流程
│   ├── excel-workflow.test.ts    # Excel 导出/导入流程
│   └── incremental.test.ts       # 增量提取测试
├── fixtures/                      # 测试固件
│   ├── input/                    # 测试输入文件
│   │   ├── sample.vue
│   │   ├── sample.jsx
│   │   └── sample.ts
│   └── expected/                 # 期望输出
│       ├── sample.vue.expected
│       └── locales.json.expected
└── helpers/                       # 测试工具函数
    ├── tempDir.ts                # 临时目录管理
    └── fixtures.ts               # 固件加载工具
```

### 测试策略

1. **单元测试**：

   - 测试核心转换逻辑（AST 转换、字符串提取）
   - 使用快照测试验证代码转换结果
   - 覆盖边界情况（注释、模板字符串、JSX）

2. **集成测试**：

   - 在临时目录中测试完整流程
   - 验证文件读写、语言包生成
   - 测试 Excel 导出/导入工作流
   - 每次测试后自动清理临时文件

3. **测试工具**：

   ```typescript
   // helpers/tempDir.ts
   import { mkdtempSync, rmSync } from 'fs'
   import { tmpdir } from 'os'
   import { join } from 'path'

   export function createTempDir(): string {
     return mkdtempSync(join(tmpdir(), 'i18n-test-'))
   }

   export function cleanupTempDir(dir: string): void {
     rmSync(dir, { recursive: true, force: true })
   }
   ```

## 第二部分：npm 发布配置

### 包名和作用域

**packages/i18n-extract-cli/package.json**：

```json
{
  "name": "@bakarhythm/i18n-extract-cli",
  "version": "1.0.0",
  "description": "自动将代码里的中文转成i18n国际化标记的命令行工具",
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "i18n-extract": "bin/index.js",
    "it": "bin/index.js"
  }
}
```

**packages/translate-utils/package.json**：

```json
{
  "name": "@bakarhythm/translate-utils",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

### 发布流程

```bash
# 1. 运行测试
pnpm test

# 2. 添加 changeset
pnpm changeset-add

# 3. 更新版本
pnpm version-packages

# 4. 构建
pnpm build

# 5. 发布到 npm
pnpm release
```

### npm 发布选项

- **公开包**：免费，包名必须唯一（`@bakarhythm/i18n-extract-cli`）
- **私有包**：需要 npm 付费订阅，支持 `@scope/package`
- **私有 registry**：团队自建（如 Verdaccio），完全控制

## 第三部分：Skill 设计

### Skill 文件结构

```
skills/i18n-extract/
├── skill.md                       # skill 主文件
├── references/                    # 参考文档
│   ├── README.md                 # 完整使用文档
│   ├── config-examples.md        # 配置示例
│   └── troubleshooting.md        # 常见问题
└── scripts/                       # 辅助脚本（可选）
    └── install.sh                # 自动安装脚本
```

### skill.md 核心内容

````markdown
---
name: i18n-extract
description: 自动提取 Vue/React 项目中的中文并替换为 i18n 标记，支持 Excel 翻译工作流
---

# i18n 国际化提取工具

## 前置要求

确保项目已安装：

```bash
npm install @bakarhythm/i18n-extract-cli -D
# 或全局安装
npm install @bakarhythm/i18n-extract-cli -g
```
````

## 使用场景

### 场景 1：新项目初始化

1. 初始化配置文件：

```bash
npx @bakarhythm/i18n-extract-cli init
```

2. 编辑 `i18n.config.js` 配置

3. 执行首次提取：

```bash
npx @bakarhythm/i18n-extract-cli -c i18n.config.js
```

### 场景 2：增量提取新增中文

```bash
npx @bakarhythm/i18n-extract-cli -c i18n.config.js
```

配置中需要设置 `incremental: true`

### 场景 3：Excel 翻译工作流

1. 导出语言包到 Excel：

```bash
npx @bakarhythm/i18n-extract-cli --skip-extract --skip-translate --exportExcel
```

2. 人工翻译 Excel 文件

3. 导入 Excel 更新语言包：

```bash
npx @bakarhythm/i18n-extract-cli loadExcel -c i18n.config.js
```

### 场景 4：API 自动翻译

```bash
npx @bakarhythm/i18n-extract-cli --locales en ja -c i18n.config.js
```

## 配置参考

详见 `references/config-examples.md`

````

### Skill 安装方式

**手动安装**：
```bash
cp -r skills/i18n-extract ~/.claude/skills/
````

**自动安装脚本**（scripts/install.sh）：

```bash
#!/bin/bash
SKILL_DIR="$HOME/.claude/skills/i18n-extract"
mkdir -p "$HOME/.claude/skills"
cp -r "$(dirname "$0")/.." "$SKILL_DIR"
echo "✅ Skill installed to $SKILL_DIR"
```

## 第四部分：完整工作流

### 开发到发布流程

```
修改代码
    ↓
运行 vitest 测试
    ↓
测试通过？ → 否 → 返回修改
    ↓ 是
pnpm changeset-add
    ↓
pnpm version-packages
    ↓
pnpm build
    ↓
pnpm release（发布到 npm）
    ↓
更新 skill 文档
    ↓
用户安装/更新 npm 包
    ↓
用户安装/更新 skill
```

### 用户使用流程

1. **安装 npm 包**：

```bash
npm install @bakarhythm/i18n-extract-cli -D
```

2. **安装 skill**：

```bash
cp -r skills/i18n-extract ~/.claude/skills/
```

3. **在 Claude Code 中使用**：
   - 用户："帮我初始化 i18n 配置"
   - Claude 自动调用 skill，执行相应命令

### Skill 和 npm 包的关系

- **Skill**：Claude 的"使用手册"，告诉 Claude 如何使用工具
- **npm 包**：实际的工具，Skill 通过命令行调用它
- **独立更新**：npm 包更新功能，skill 更新使用说明

## 实施步骤

### 阶段 1：测试框架搭建（优先级：高）

1. 安装 vitest 依赖
2. 创建 vitest 配置文件
3. 创建测试目录结构
4. 编写核心功能的单元测试
5. 编写集成测试

### 阶段 2：npm 发布准备（优先级：高）

1. 修改 package.json 的包名为 `@bakarhythm/*`
2. 更新 README 和文档
3. 验证构建流程
4. 测试发布流程（可先发布到测试环境）

### 阶段 3：Skill 创建（优先级：中）

1. 创建 skills/i18n-extract/ 目录
2. 编写 skill.md 主文件
3. 编写参考文档
4. 创建安装脚本
5. 测试 skill 在 Claude Code 中的使用

### 阶段 4：文档和示例（优先级：中）

1. 更新项目 README
2. 完善配置示例
3. 更新 examples/ 示例项目
4. 编写故障排查文档

## 技术风险和缓解措施

### 风险 1：测试覆盖不足

**缓解措施**：

- 优先测试核心转换逻辑
- 使用快照测试降低维护成本
- 保留 examples/ 作为手动验证

### 风险 2：npm 包名冲突

**缓解措施**：

- 使用 `@bakarhythm` 作用域避免冲突
- 发布前验证包名可用性

### 风险 3：Skill 和工具版本不同步

**缓解措施**：

- Skill 文档中明确版本要求
- 提供版本检查命令
- 在 skill.md 中添加版本兼容性说明

## 成功标准

1. ✅ vitest 测试覆盖核心功能，测试通过率 100%
2. ✅ 成功发布 `@bakarhythm/i18n-extract-cli` 到 npm
3. ✅ Skill 可以在 Claude Code 中正常调用
4. ✅ 支持初始化、增量提取、Excel 翻译等全场景
5. ✅ 文档完善，用户可以独立使用

## 后续优化

1. 添加 CI/CD 自动化测试和发布
2. 增加更多测试用例覆盖边界情况
3. 优化 Skill 的交互体验
4. 收集用户反馈持续改进
