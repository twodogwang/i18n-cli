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

## 常见问题

详见 `references/troubleshooting.md`
