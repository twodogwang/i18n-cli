# i18n-cli 发布和 Skill 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 vitest 测试框架，修改包名发布到 npm，创建 Claude Code skill

**Architecture:** Monorepo 结构，测试放在各包内，skill 独立管理调用 npm 包

**Tech Stack:** vitest, unbuild, pnpm workspace, changesets

---

## Task 1: 安装 vitest 依赖

**Files:**

- Modify: `package.json`
- Modify: `packages/i18n-extract-cli/package.json`

**Step 1: 在根目录安装 vitest**

```bash
pnpm add -D -w vitest @vitest/ui
```

**Step 2: 在 i18n-extract-cli 包中添加测试脚本**

修改 `packages/i18n-extract-cli/package.json`，添加：

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

**Step 3: 在根目录添加测试脚本**

修改 `package.json`，添加：

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:run": "turbo run test:run"
  }
}
```

**Step 4: 验证安装**

```bash
pnpm install
```

Expected: 依赖安装成功

**Step 5: Commit**

```bash
git add package.json packages/i18n-extract-cli/package.json pnpm-lock.yaml
git commit -m "chore: 添加 vitest 测试依赖"
```

---

## Task 2: 创建 vitest 配置文件

**Files:**

- Create: `vitest.config.ts`
- Create: `packages/i18n-extract-cli/vitest.config.ts`

**Step 1: 创建根目录 vitest 配置**

创建 `vitest.config.ts`：

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

**Step 2: 创建包级别 vitest 配置**

创建 `packages/i18n-extract-cli/vitest.config.ts`：

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

**Step 3: 验证配置**

```bash
cd packages/i18n-extract-cli && pnpm test --run
```

Expected: 提示 "No test files found"（因为还没有测试文件）

**Step 4: Commit**

```bash
git add vitest.config.ts packages/i18n-extract-cli/vitest.config.ts
git commit -m "chore: 添加 vitest 配置文件"
```

---

## Task 3: 创建测试目录结构和辅助工具

**Files:**

- Create: `packages/i18n-extract-cli/test/helpers/tempDir.ts`
- Create: `packages/i18n-extract-cli/test/helpers/fixtures.ts`
- Create: `packages/i18n-extract-cli/test/fixtures/input/.gitkeep`
- Create: `packages/i18n-extract-cli/test/fixtures/expected/.gitkeep`

**Step 1: 创建测试目录结构**

```bash
cd packages/i18n-extract-cli
mkdir -p test/{unit,integration,fixtures/{input,expected},helpers}
touch test/fixtures/input/.gitkeep test/fixtures/expected/.gitkeep
```

**Step 2: 创建临时目录管理工具**

创建 `test/helpers/tempDir.ts`：

```typescript
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

**Step 3: 创建固件加载工具**

创建 `test/helpers/fixtures.ts`：

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'

const FIXTURES_DIR = join(__dirname, '../fixtures')

export function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, 'input', filename), 'utf-8')
}

export function loadExpected(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, 'expected', filename), 'utf-8')
}
```

**Step 4: Commit**

```bash
git add test/
git commit -m "test: 创建测试目录结构和辅助工具"
```

---

## Task 4: 编写第一个单元测试（transformJs）

**Files:**

- Create: `packages/i18n-extract-cli/test/unit/transformJs.test.ts`
- Create: `packages/i18n-extract-cli/test/fixtures/input/sample.js`
- Create: `packages/i18n-extract-cli/test/fixtures/expected/sample.js.expected`

**Step 1: 创建测试固件**

创建 `test/fixtures/input/sample.js`：

```javascript
const msg = '你好'
console.log('测试')
```

创建 `test/fixtures/expected/sample.js.expected`：

```javascript
import { t } from 'i18n'

const msg = t('你好')
console.log(t('测试'))
```

**Step 2: 编写测试**

创建 `test/unit/transformJs.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { loadFixture, loadExpected } from '../helpers/fixtures'
import { transformJs } from '../../src/transformJs'

describe('transformJs', () => {
  it('应该提取并替换 JS 文件中的中文', () => {
    const input = loadFixture('sample.js')
    const expected = loadExpected('sample.js.expected')

    const result = transformJs(input, {
      functionName: 't',
      importDeclaration: 'import { t } from "i18n"',
    })

    expect(result.code.trim()).toBe(expected.trim())
  })
})
```

**Step 3: 运行测试**

```bash
pnpm test:run
```

Expected: 测试通过

**Step 4: Commit**

```bash
git add test/
git commit -m "test: 添加 transformJs 单元测试"
```

---

## Task 5: 编写 Vue 转换单元测试

**Files:**

- Create: `packages/i18n-extract-cli/test/unit/transformVue.test.ts`
- Create: `packages/i18n-extract-cli/test/fixtures/input/sample.vue`
- Create: `packages/i18n-extract-cli/test/fixtures/expected/sample.vue.expected`

**Step 1: 创建测试固件**

创建 `test/fixtures/input/sample.vue`：

```vue
<template>
  <div>你好</div>
</template>

<script>
export default {
  data() {
    return {
      msg: '测试',
    }
  },
}
</script>
```

创建 `test/fixtures/expected/sample.vue.expected`：

```vue
<template>
  <div>{{ $t('你好') }}</div>
</template>

<script>
export default {
  data() {
    return {
      msg: this.$t('测试'),
    }
  },
}
</script>
```

**Step 2: 编写测试**

创建 `test/unit/transformVue.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { loadFixture, loadExpected } from '../helpers/fixtures'
import { transformVue } from '../../src/transformVue'

describe('transformVue', () => {
  it('应该提取并替换 Vue 文件中的中文', () => {
    const input = loadFixture('sample.vue')
    const expected = loadExpected('sample.vue.expected')

    const result = transformVue(input, {
      caller: 'this',
      functionNameInTemplate: '$t',
      functionNameInScript: '$t',
    })

    expect(result.code.trim()).toBe(expected.trim())
  })
})
```

**Step 3: 运行测试**

```bash
pnpm test:run
```

Expected: 测试通过

**Step 4: Commit**

```bash
git add test/
git commit -m "test: 添加 transformVue 单元测试"
```

---

## Task 6: 编写集成测试（完整提取流程）

**Files:**

- Create: `packages/i18n-extract-cli/test/integration/extract-flow.test.ts`

**Step 1: 编写集成测试**

创建 `test/integration/extract-flow.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createTempDir, cleanupTempDir } from '../helpers/tempDir'
import { run } from '../../src/core'

describe('完整提取流程', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    cleanupTempDir(tempDir)
  })

  it('应该提取中文并生成语言包', async () => {
    // 创建测试文件
    const testFile = join(tempDir, 'test.js')
    writeFileSync(testFile, `const msg = '你好'`)

    // 执行提取
    await run({
      input: tempDir,
      localePath: join(tempDir, 'locales/zh-CN.json'),
      rules: {
        js: {
          functionName: 't',
          importDeclaration: 'import { t } from "i18n"',
        },
      },
    })

    // 验证转换后的文件
    const transformed = readFileSync(testFile, 'utf-8')
    expect(transformed).toContain('import { t } from "i18n"')
    expect(transformed).toContain("t('你好')")

    // 验证语言包
    const localePath = join(tempDir, 'locales/zh-CN.json')
    expect(existsSync(localePath)).toBe(true)

    const locales = JSON.parse(readFileSync(localePath, 'utf-8'))
    expect(locales['你好']).toBe('你好')
  })
})
```

**Step 2: 运行测试**

```bash
pnpm test:run
```

Expected: 测试通过

**Step 3: Commit**

```bash
git add test/integration/extract-flow.test.ts
git commit -m "test: 添加完整提取流程集成测试"
```

---

## Task 7: 修改包名为 @bakarhythm 作用域

**Files:**

- Modify: `packages/i18n-extract-cli/package.json`
- Modify: `packages/translate-utils/package.json`

**Step 1: 修改 i18n-extract-cli 包名**

修改 `packages/i18n-extract-cli/package.json`：

```json
{
  "name": "@bakarhythm/i18n-extract-cli",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 2: 修改 translate-utils 包名**

修改 `packages/translate-utils/package.json`：

```json
{
  "name": "@bakarhythm/translate-utils",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 3: 更新 i18n-extract-cli 的依赖**

修改 `packages/i18n-extract-cli/package.json` 中的依赖：

```json
{
  "dependencies": {
    "@bakarhythm/translate-utils": "workspace:*"
  }
}
```

**Step 4: 重新安装依赖**

```bash
pnpm install
```

Expected: 依赖更新成功

**Step 5: 运行测试验证**

```bash
pnpm test:run
```

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add packages/*/package.json pnpm-lock.yaml
git commit -m "chore: 修改包名为 @bakarhythm 作用域"
```

---

## Task 8: 创建 Skill 目录结构

**Files:**

- Create: `skills/i18n-extract/skill.md`
- Create: `skills/i18n-extract/references/README.md`
- Create: `skills/i18n-extract/references/config-examples.md`
- Create: `skills/i18n-extract/references/troubleshooting.md`
- Create: `skills/i18n-extract/scripts/install.sh`

**Step 1: 创建目录结构**

```bash
mkdir -p skills/i18n-extract/{references,scripts}
```

**Step 2: 创建 skill.md 主文件**

创建 `skills/i18n-extract/skill.md`：

```markdown
---
name: i18n-extract
description: 自动提取 Vue/React 项目中的中文并替换为 i18n 标记，支持 Excel 翻译工作流
---

# i18n 国际化提取工具

## 前置要求

确保项目已安装：

\`\`\`bash
npm install @bakarhythm/i18n-extract-cli -D

# 或全局安装

npm install @bakarhythm/i18n-extract-cli -g
\`\`\`

## 使用场景

### 场景 1：新项目初始化

1. 初始化配置文件：

\`\`\`bash
npx @bakarhythm/i18n-extract-cli init
\`\`\`

2. 编辑 `i18n.config.js` 配置

3. 执行首次提取：

\`\`\`bash
npx @bakarhythm/i18n-extract-cli -c i18n.config.js
\`\`\`

### 场景 2：增量提取新增中文

\`\`\`bash
npx @bakarhythm/i18n-extract-cli -c i18n.config.js
\`\`\`

配置中需要设置 `incremental: true`

### 场景 3：Excel 翻译工作流

1. 导出语言包到 Excel：

\`\`\`bash
npx @bakarhythm/i18n-extract-cli --skip-extract --skip-translate --exportExcel
\`\`\`

2. 人工翻译 Excel 文件

3. 导入 Excel 更新语言包：

\`\`\`bash
npx @bakarhythm/i18n-extract-cli loadExcel -c i18n.config.js
\`\`\`

### 场景 4：API 自动翻译

\`\`\`bash
npx @bakarhythm/i18n-extract-cli --locales en ja -c i18n.config.js
\`\`\`

## 配置参考

详见 `references/config-examples.md`

## 常见问题

详见 `references/troubleshooting.md`
```

**Step 3: 创建安装脚本**

创建 `skills/i18n-extract/scripts/install.sh`：

```bash
#!/bin/bash
SKILL_DIR="$HOME/.claude/skills/i18n-extract"
mkdir -p "$HOME/.claude/skills"
cp -r "$(dirname "$0")/.." "$SKILL_DIR"
echo "✅ Skill installed to $SKILL_DIR"
```

**Step 4: 添加执行权限**

```bash
chmod +x skills/i18n-extract/scripts/install.sh
```

**Step 5: Commit**

```bash
git add skills/
git commit -m "feat: 创建 i18n-extract skill 基础结构"
```

---

## Task 9: 编写 Skill 参考文档

**Files:**

- Modify: `skills/i18n-extract/references/README.md`
- Modify: `skills/i18n-extract/references/config-examples.md`
- Modify: `skills/i18n-extract/references/troubleshooting.md`

**Step 1: 编写 README**

创建 `skills/i18n-extract/references/README.md`，复制项目的 README 内容并调整包名为 `@bakarhythm/i18n-extract-cli`

**Step 2: 编写配置示例**

创建 `skills/i18n-extract/references/config-examples.md`：

```markdown
# 配置示例

## Vue 3 项目配置

\`\`\`javascript
module.exports = {
input: './src',
localePath: './locales/zh-CN.json',
locales: ['en', 'ja'],

rules: {
vue: {
importDeclaration: 'import { useI18n } from "vue-i18n"',
functionNameInTemplate: 't',
functionNameInScript: 't',
functionSnippets: 'const { t } = useI18n()',
customizeKey(key) {
return key
},
},
},
}
\`\`\`

## React 项目配置

\`\`\`javascript
module.exports = {
input: './src',
localePath: './locales/zh-CN.json',

rules: {
jsx: {
functionName: 't',
importDeclaration: 'import { t } from "i18n"',
},
},
}
\`\`\`

## Excel 翻译工作流配置

\`\`\`javascript
module.exports = {
input: './src',
localePath: './locales/zh-CN.json',

translateFromExcel: true,
excelPath: './locales.xlsx',
backfillExcel: true,

mergeLocales: true,
}
\`\`\`
```

**Step 3: 编写故障排查文档**

创建 `skills/i18n-extract/references/troubleshooting.md`：

```markdown
# 常见问题

## 1. 提取后文件为空

**原因**：可能是配置文件路径不正确

**解决方案**：

- 检查 `input` 配置是否正确
- 使用绝对路径或相对于配置文件的路径

## 2. import 语句重复导入

**原因**：多次运行提取命令

**解决方案**：

- 使用 `incremental: true` 配置
- 或在提取前先回滚代码

## 3. Excel 导入失败

**原因**：Excel 格式不正确

**解决方案**：

- 确保 Excel 表头格式为 `['字典key', 'zh-CN', 'en-US']`
- 检查 `excelPath` 配置是否正确
```

**Step 4: Commit**

```bash
git add skills/i18n-extract/references/
git commit -m "docs: 添加 skill 参考文档"
```

---

## Task 10: 更新项目 README

**Files:**

- Modify: `README.md`
- Modify: `packages/i18n-extract-cli/README.md`

**Step 1: 更新根目录 README**

修改 `README.md`，更新包名和安装说明：

```markdown
## 安装

\`\`\`bash
npm i @bakarhythm/i18n-extract-cli -g
\`\`\`

## 使用文档

[点击这里](https://github.com/bakarhythm/i18n-cli/tree/master/packages/i18n-extract-cli)
```

**Step 2: 更新包 README**

修改 `packages/i18n-extract-cli/README.md`，全局替换包名：

```bash
# 在 packages/i18n-extract-cli 目录下
sed -i '' 's/@ifreeovo\/i18n-extract-cli/@bakarhythm\/i18n-extract-cli/g' README.md
```

**Step 3: Commit**

```bash
git add README.md packages/i18n-extract-cli/README.md
git commit -m "docs: 更新 README 包名为 @bakarhythm"
```

---

## Task 11: 验证构建和测试流程

**Files:**

- None (验证步骤)

**Step 1: 清理构建产物**

```bash
pnpm clean
# 或手动删除
rm -rf packages/*/dist
```

**Step 2: 运行完整构建**

```bash
pnpm build
```

Expected: 构建成功，生成 dist 目录

**Step 3: 运行所有测试**

```bash
pnpm test:run
```

Expected: 所有测试通过

**Step 4: 检查构建产物**

```bash
ls -la packages/i18n-extract-cli/dist/
ls -la packages/translate-utils/dist/
```

Expected: 包含 index.cjs 和 index.mjs 文件

**Step 5: 本地测试 CLI**

```bash
cd examples/vue-demo
node ../../packages/i18n-extract-cli/bin/index.js --help
```

Expected: 显示帮助信息

---

## Task 12: 准备发布到 npm

**Files:**

- Modify: `.changeset/config.json` (如果需要)

**Step 1: 验证 npm 登录**

```bash
npm whoami
```

Expected: 显示你的 npm 用户名

如果未登录：

```bash
npm login
```

**Step 2: 检查包名可用性**

```bash
npm view @bakarhythm/i18n-extract-cli
```

Expected: 显示 "npm ERR! 404" 表示包名可用

**Step 3: 添加 changeset**

```bash
pnpm changeset-add
```

选择：

- 选择 `@bakarhythm/i18n-extract-cli` 和 `@bakarhythm/translate-utils`
- 选择 `major` (因为是首次发布)
- 输入变更说明："首次发布 @bakarhythm 作用域版本"

**Step 4: 更新版本**

```bash
pnpm version-packages
```

Expected: 版本更新为 1.0.0

**Step 5: Commit 版本变更**

```bash
git add .
git commit -m "chore: 发布 v1.0.0"
```

---

## Task 13: 发布到 npm

**Files:**

- None (发布步骤)

**Step 1: 最后一次构建**

```bash
pnpm build
```

Expected: 构建成功

**Step 2: 发布到 npm**

```bash
pnpm release
```

Expected: 发布成功，显示包的 npm 链接

**Step 3: 验证发布**

```bash
npm view @bakarhythm/i18n-extract-cli
npm view @bakarhythm/translate-utils
```

Expected: 显示包信息，版本为 1.0.0

**Step 4: 测试安装**

```bash
mkdir /tmp/test-install
cd /tmp/test-install
npm init -y
npm install @bakarhythm/i18n-extract-cli
npx @bakarhythm/i18n-extract-cli --help
```

Expected: 成功安装并显示帮助信息

**Step 5: 推送到 git**

```bash
git push origin main
git push --tags
```

---

## Task 14: 安装和测试 Skill

**Files:**

- None (安装步骤)

**Step 1: 安装 skill**

```bash
cp -r skills/i18n-extract ~/.claude/skills/
```

或使用安装脚本：

```bash
bash skills/i18n-extract/scripts/install.sh
```

**Step 2: 验证 skill 安装**

```bash
ls -la ~/.claude/skills/i18n-extract/
```

Expected: 显示 skill 文件结构

**Step 3: 在 Claude Code 中测试**

打开 Claude Code，在一个测试项目中说：

"帮我初始化 i18n 配置"

Expected: Claude 调用 skill，执行 `npx @bakarhythm/i18n-extract-cli init`

**Step 4: 测试其他场景**

测试以下场景：

- "帮我提取项目中的中文"
- "帮我导出语言包到 Excel"
- "帮我从 Excel 导入翻译"

Expected: Claude 正确识别场景并执行相应命令

---

## 完成标准

- ✅ vitest 测试框架搭建完成，核心测试通过
- ✅ 包名修改为 `@bakarhythm/*`
- ✅ 成功发布到 npm
- ✅ Skill 创建完成并可在 Claude Code 中使用
- ✅ 文档更新完整

## 后续工作

1. 添加更多测试用例（边界情况、错误处理）
2. 添加 CI/CD 自动化测试和发布
3. 收集用户反馈优化 skill 交互
4. 完善文档和示例
