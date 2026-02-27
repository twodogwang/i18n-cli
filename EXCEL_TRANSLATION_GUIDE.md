# Excel 翻译功能使用指南

## 功能说明

新增了从 Excel 文件读取翻译的功能，可以在提取中文到语言包的同时，从指定的 Excel 文件中读取已有的翻译，而不是调用翻译 API。

## 配置选项

在 `i18n.config.js` 中添加以下配置：

```javascript
module.exports = {
  // ... 其他配置

  // 启用从 Excel 读取翻译
  translateFromExcel: true,

  // Excel 文件路径
  excelPath: './locales.xlsx',

  // 是否回填新 key 到 Excel（当 Excel 中不存在某个 key 时）
  backfillExcel: true,

  // 目标语言
  locales: ['en-US', 'ja-JP'],
}
```

## Excel 文件格式

Excel 文件的格式如下：

| 字典 key     | zh-CN        | en-US           | ja-JP                 |
| ------------ | ------------ | --------------- | --------------------- |
| 计数器       | 计数器       | Counter         | カウンター            |
| 切换语言     | 切换语言     | Switch Language | 言語を切り替える      |
| 点击数字加 1 | 点击数字加 1 | Click to add 1  | クリックして 1 を追加 |

**注意：**

- 第一列必须是 `字典key`
- 第二列必须是 `zh-CN`（中文语言包）
- 后续列是目标语言（如 `en-US`、`ja-JP` 等）

## 使用步骤

### 1. 准备 Excel 文件

创建一个 Excel 文件（如 `locales.xlsx`），包含已有的翻译。

### 2. 修改配置文件

在项目根目录的 `i18n.config.js` 中添加配置：

```javascript
module.exports = {
  localePath: './src/locales/zh-CN.json',
  translateFromExcel: true,
  excelPath: './locales.xlsx',
  backfillExcel: true,
  locales: ['en-US', 'ja-JP'],
  rules: {
    tsx: {
      importDeclaration: 'import { t } from "@/utils/i18n"',
    },
  },
}
```

### 3. 运行提取命令

```bash
it -c i18n.config.js
```

## 功能特性

### 1. 从 Excel 读取翻译

- 工具会读取 Excel 文件中的翻译
- 如果 Excel 中存在某个 key 的翻译，则使用 Excel 中的翻译
- 如果 Excel 中某个 key 的翻译为空，则保持为空

### 2. 自动回填新 key

当启用 `backfillExcel: true` 时：

- 如果代码中提取到新的中文 key，但 Excel 中不存在
- 工具会自动将新 key 追加到 Excel 文件末尾
- 新 key 的翻译列为空，方便后续人工翻译

### 3. 增量翻译

- 如果主语言（中文）的值没有变化，会复用旧的翻译
- 只有当中文内容变化时，才会从 Excel 重新读取翻译

### 4. 错误处理

- **Excel 文件不存在**：提示错误并退出
- **Excel 格式错误**：检查表头格式，至少需要 3 列
- **语言不匹配**：警告用户 Excel 中缺少某些语言列
- **回填失败**：记录错误但不中断流程

## 示例场景

### 场景 1：完整翻译

Excel 包含所有 key 的翻译：

```
字典key | zh-CN | en-US | ja-JP
计数器 | 计数器 | Counter | カウンター
```

运行后，生成的语言包：

- `en-US.json`: `{"计数器": "Counter"}`
- `ja-JP.json`: `{"计数器": "カウンター"}`

### 场景 2：部分翻译

Excel 只包含部分 key：

```
字典key | zh-CN | en-US | ja-JP
计数器 | 计数器 | Counter | カウンター
```

代码中提取到新 key `切换语言`，运行后：

1. 生成的语言包包含 `计数器` 的翻译
2. `切换语言` 的翻译为空
3. Excel 文件自动追加新行：`切换语言 | 切换语言 | | `

### 场景 3：翻译为空

Excel 中某些翻译为空：

```
字典key | zh-CN | en-US | ja-JP
计数器 | 计数器 |  | カウンター
```

运行后：

- `en-US.json`: `{"计数器": ""}`（保持为空）
- `ja-JP.json`: `{"计数器": "カウンター"}`

## 与 API 翻译的区别

| 特性     | Excel 翻译                 | API 翻译                                 |
| -------- | -------------------------- | ---------------------------------------- |
| 配置     | `translateFromExcel: true` | `translateFromExcel: false`（默认）      |
| 翻译来源 | Excel 文件                 | 翻译 API（Google/Youdao/Baidu/Alicloud） |
| 缺失翻译 | 回填到 Excel               | 自动调用 API 翻译                        |
| 适用场景 | 已有人工翻译               | 需要自动翻译                             |

## 注意事项

1. **Excel 文件格式**：必须严格按照格式创建，第一列是 `字典key`，第二列是 `zh-CN`
2. **语言代码**：Excel 表头的语言代码必须与配置中的 `locales` 一致
3. **向后兼容**：默认 `translateFromExcel: false`，不影响现有功能
4. **优先级**：`skipTranslate: true` > `translateFromExcel: true` > API 翻译

## 快速测试

1. 创建测试 Excel 文件（可以用 Excel 或 WPS 创建）
2. 在配置文件中启用 `translateFromExcel: true`
3. 运行 `it -c i18n.config.js`
4. 检查生成的语言包文件
5. 检查 Excel 是否回填了新 key

## 构建项目

如果需要使用新功能，需要先构建项目：

```bash
# 在项目根目录
pnpm build

# 或者使用开发模式（实时编译）
pnpm dev
```

构建完成后，就可以在示例项目或实际项目中使用新功能了。
