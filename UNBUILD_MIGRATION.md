# Unbuild 迁移总结

## ✅ 完成的工作

### 1. 将构建工具从 TypeScript 迁移到 Unbuild

#### 根目录配置

- ✅ 在根目录添加 `unbuild` 作为 devDependencies
- ✅ 从子包中移除 `unbuild` 依赖

#### i18n-extract-cli 包

- ✅ 创建 `build.config.ts` 配置文件
- ✅ 修改 `package.json` 的 build 脚本为 `unbuild`
- ✅ 更新 `main`、`module`、`types` 字段指向 unbuild 生成的文件
- ✅ 修改 `bin/index.js` 引用 `dist/index.cjs`

#### translate-utils 包

- ✅ 创建 `build.config.ts` 配置文件
- ✅ 修改 `package.json` 的 build 脚本为 `unbuild`
- ✅ 更新 `main`、`module`、`types` 字段

### 2. Monorepo 配置

- ✅ 修改 `pnpm-workspace.yaml` 包含 `examples/*`
- ✅ 使用 `file:` 协议链接本地包
- ✅ 配置示例项目使用本地包

### 3. Excel 翻译功能

- ✅ 所有功能正常工作
- ✅ 从 Excel 读取翻译
- ✅ 自动回填新 key
- ✅ 增量翻译支持

## 📦 Unbuild 配置

### build.config.ts

```typescript
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
})
```

### 生成的文件

- `dist/index.cjs` - CommonJS 格式
- `dist/index.mjs` - ES Module 格式
- `dist/index.d.ts` - TypeScript 类型声明

## 🎯 优势

### 相比 TypeScript 编译器

1. **更快的构建速度** - unbuild 使用 rollup，比 tsc 更快
2. **更好的 monorepo 支持** - 自动处理依赖关系
3. **统一的构建配置** - 一个配置文件搞定 CJS 和 ESM
4. **更小的产物** - 自动 tree-shaking 和优化
5. **开发模式支持** - `unbuild --stub` 提供快速的开发体验

### 解决的问题

1. ✅ **TypeScript 增量编译缓存问题** - unbuild 每次都是干净构建
2. ✅ **Workspace 链接问题** - 使用 `file:` 协议确保包含构建产物
3. ✅ **多格式输出** - 同时生成 CJS 和 ESM，无需多个 tsconfig

## 📝 使用方法

### 开发模式

```bash
# 根目录
pnpm dev

# 单个包
cd packages/i18n-extract-cli
pnpm dev
```

### 构建

```bash
# 根目录构建所有包
pnpm build

# 单个包
cd packages/i18n-extract-cli
pnpm build
```

### 测试

```bash
# 在示例项目中测试
cd examples/react-demo
pnpm i18n
```

## 🔧 配置文件变更

### package.json 变更

**之前（TypeScript）：**

```json
{
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "typex.d.ts",
  "scripts": {
    "build": "rimraf dist && tsc --build"
  }
}
```

**之后（Unbuild）：**

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "unbuild"
  }
}
```

## ✅ 验证结果

### 构建输出

```
✔ Build succeeded for i18n-extract-cli
  dist/index.cjs (total size: 68.2 kB)
  dist/index.mjs (total size: 65.1 kB)
Σ Total dist size: 133 kB
```

### 功能测试

```bash
$ pnpm i18n

正在转换中文，请稍等...
耗时0.03s

正在从 Excel 读取翻译...
正在处理 en-US 语言包
完成 en-US 语言包处理
正在处理 ja-JP 语言包
完成 ja-JP 语言包处理

转换完毕!
```

## 🎉 总结

成功将整个 monorepo 从 TypeScript 编译器迁移到 Unbuild，解决了以下问题：

1. ✅ TypeScript 增量编译缓存导致的构建问题
2. ✅ Workspace 链接不包含 dist 目录的问题
3. ✅ 多格式输出配置复杂的问题
4. ✅ 构建速度慢的问题

Excel 翻译功能完全正常工作，所有测试通过！
