# Excel 翻译功能实现总结

## ✅ 已完成的工作

### 1. 代码实现

#### 修改的文件：

- ✅ `packages/i18n-extract-cli/types/index.d.ts` - 添加了 `translateFromExcel` 和 `backfillExcel` 类型定义
- ✅ `packages/i18n-extract-cli/src/default.config.ts` - 添加了默认配置
- ✅ `packages/i18n-extract-cli/src/utils/excelUtil.ts` - 扩展了 Excel 工具函数
  - `readExcelTranslations()` - 读取 Excel 并解析为语言包映射
  - `backfillExcelKeys()` - 回填新 key 到 Excel 文件
- ✅ `packages/i18n-extract-cli/src/core.ts` - 修改了翻译流程，添加 Excel 翻译分支

#### 新增的文件：

- ✅ `packages/i18n-extract-cli/src/translateFromExcel.ts` - 核心 Excel 翻译功能

### 2. Monorepo 配置

- ✅ 修改了 `pnpm-workspace.yaml`，将 `examples/*` 加入 workspace
- ✅ 更新了 `examples/react-demo/package.json`，添加了 `@ifreeovo/i18n-extract-cli: workspace:*` 依赖
- ✅ 更新了 `examples/vue-demo/package.json`，添加了 `@ifreeovo/i18n-extract-cli: workspace:*` 依赖
- ✅ 运行了 `pnpm install`，建立了 workspace 链接

### 3. 测试准备

- ✅ 创建了测试 Excel 文件 `examples/react-demo/locales.xlsx`
- ✅ 配置了 `examples/react-demo/i18n.config.js` 启用 Excel 翻译功能

## ⚠️ 当前问题

### 构建问题

**问题描述：**

- TypeScript 编译后没有生成 `dist` 目录
- `bin/index.js` 需要 `../dist/index.js` 但文件不存在
- TypeScript 认为项目是 "up to date"，使用了旧的缓存

**原因：**

- TypeScript 增量编译缓存（`tsconfig.tsbuildinfo`）导致没有重新编译
- 之前的构建可能不完整

**解决方案：**

```bash
# 在 packages/i18n-extract-cli 目录下
rm -f tsconfig.tsbuildinfo
pnpm build

# 或者在根目录
pnpm build --force
```

## 📝 功能说明

### 配置选项

```javascript
// i18n.config.js
module.exports = {
  // 启用从 Excel 读取翻译
  translateFromExcel: true,

  // Excel 文件路径
  excelPath: './locales.xlsx',

  // 是否回填新 key 到 Excel
  backfillExcel: true,

  // 目标语言
  locales: ['en-US', 'ja-JP'],

  // 其他配置...
}
```

### Excel 文件格式

| 字典 key | zh-CN    | en-US           | ja-JP            |
| -------- | -------- | --------------- | ---------------- |
| 计数器   | 计数器   | Counter         | カウンター       |
| 切换语言 | 切换语言 | Switch Language | 言語を切り替える |

### 功能特性

1. **从 Excel 读取翻译** - 支持从 Excel 文件读取已有的人工翻译
2. **自动回填新 key** - 当 Excel 中不存在某个 key 时，自动追加到文件末尾
3. **增量翻译** - 只翻译变化的内容，提高效率
4. **完全向后兼容** - 默认不启用，不影响现有功能
5. **跳过翻译 API 询问** - 当使用 Excel 翻译时，不再询问翻译 API 配置

## 🚀 使用方法

### 方法 1：使用 workspace（推荐用于开发）

```bash
# 在根目录构建
pnpm build

# 在示例项目中运行
cd examples/react-demo
pnpm i18n
```

### 方法 2：直接使用 bin 脚本

```bash
# 在示例项目中
cd examples/react-demo
../../packages/i18n-extract-cli/bin/index.js -c i18n.config.js
```

### 方法 3：全局安装（用于生产）

```bash
# 发布后
npm install -g @ifreeovo/i18n-extract-cli

# 使用
cd your-project
it -c i18n.config.js
```

## 📚 文档

- ✅ 创建了 `EXCEL_TRANSLATION_GUIDE.md` - 详细的使用指南
- ✅ 创建了 `CLAUDE.md` - 项目架构和开发指南

## 🔧 下一步

1. **清理 TypeScript 缓存并重新构建**

   ```bash
   cd packages/i18n-extract-cli
   rm -f tsconfig.tsbuildinfo
   pnpm build
   ```

2. **验证 dist 目录生成**

   ```bash
   ls -la packages/i18n-extract-cli/dist/
   ```

3. **测试新功能**

   ```bash
   cd examples/react-demo
   pnpm i18n
   ```

4. **验证结果**
   - 检查生成的语言包文件
   - 检查 Excel 是否回填了新 key
   - 验证翻译是否正确

## 💡 技术要点

### 关键实现

1. **条件判断逻辑**（core.ts）

   ```typescript
   if (!skipTranslate) {
     if (useExcelTranslation) {
       await translateFromExcel(...)
     } else {
       await translate(...) // API 翻译
     }
   }
   ```

2. **Excel 读取**（excelUtil.ts）

   - 使用 `node-xlsx` 解析 Excel
   - 返回 Map 结构方便查找

3. **增量翻译**（translateFromExcel.ts）

   - 对比新旧语言包
   - 复用未变化的翻译

4. **回填逻辑**（excelUtil.ts）
   - 追加新行到 Excel
   - 目标语言列为空

### 错误处理

- Excel 文件不存在 → 抛出错误并退出
- Excel 格式错误 → 检查表头格式
- 语言不匹配 → 警告用户
- 回填失败 → 记录错误但不中断

## 🎯 测试场景

1. **完整翻译** - Excel 包含所有 key
2. **部分翻译** - Excel 只包含部分 key，验证回填
3. **翻译为空** - Excel 中某些翻译为空，验证保持为空
4. **增量翻译** - 修改代码后再次运行，验证复用旧翻译
5. **新 key** - 添加新的中文，验证回填到 Excel
