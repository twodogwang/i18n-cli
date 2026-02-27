# Vue Setup 和 Options API 配置指南

## 概述

从 v4.3.1 开始，i18n-cli 支持为 Vue 3 的 `<script setup>` 语法和 Options API 分别配置不同的 i18n 函数名和导入方式。

## 配置方式

### 方式一：统一配置（推荐用于纯 setup 项目）

如果你的项目只使用 `<script setup>` 语法，可以使用统一配置：

```javascript
module.exports = {
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
```

**效果：**

```vue
<template>
  <div>{{ t('你好') }}</div>
  <HelloWorld :msg="t('传入的内容')" />
</template>
<script setup>
import { useI18n } from 'vue-i18n' // 自动插入
import HelloWorld from './components/HelloWorld.vue'

const { t } = useI18n() // 自动插入
</script>
```

### 方式二：区分配置（推荐用于混合项目）

如果你的项目同时使用 `<script setup>` 和 Options API，可以分别配置：

```javascript
module.exports = {
  rules: {
    vue: {
      // template 中的函数名（setup 和 Options API 共用）
      functionNameInTemplate: 't',

      // === setup 语法配置 ===
      functionNameInSetup: 't',
      callerInSetup: '',
      importDeclarationForSetup: 'import { useI18n } from "vue-i18n"',
      functionSnippetsForSetup: 'const { t } = useI18n()',

      // === Options API 配置 ===
      functionNameInOptionsAPI: '$t',
      callerInOptionsAPI: 'this',
      importDeclaration: '', // Options API 不需要 import

      customizeKey(key) {
        return key
      },
    },
  },
}
```

**效果：**

**setup 语法：**

```vue
<template>
  <div>{{ t('你好') }}</div>
</template>
<script setup>
import { useI18n } from 'vue-i18n' // 自动插入
const { t } = useI18n() // 自动插入
</script>
```

**Options API：**

```vue
<template>
  <div>{{ t('你好') }}</div>
</template>
<script>
export default {
  methods: {
    greet() {
      console.log(this.$t('你好')) // 使用 this.$t()
    },
  },
}
</script>
```

## 配置项说明

### 通用配置项

| 配置项                   | 说明                                       | 默认值   |
| ------------------------ | ------------------------------------------ | -------- |
| `functionNameInTemplate` | template 中使用的函数名                    | `'$t'`   |
| `functionNameInScript`   | script 中使用的函数名（统一配置时使用）    | `'$t'`   |
| `caller`                 | 调用者（统一配置时使用）                   | `'this'` |
| `importDeclaration`      | import 语句（统一配置或 Options API 使用） | `''`     |
| `functionSnippets`       | 函数声明（统一配置时使用）                 | `''`     |

### setup 专用配置项

| 配置项                      | 说明                         | 示例                                   |
| --------------------------- | ---------------------------- | -------------------------------------- |
| `functionNameInSetup`       | setup 中使用的函数名         | `'t'`                                  |
| `callerInSetup`             | setup 中的调用者（通常为空） | `''`                                   |
| `importDeclarationForSetup` | setup 的 import 语句         | `'import { useI18n } from "vue-i18n"'` |
| `functionSnippetsForSetup`  | setup 的函数声明             | `'const { t } = useI18n()'`            |

### Options API 专用配置项

| 配置项                     | 说明                       | 示例     |
| -------------------------- | -------------------------- | -------- |
| `functionNameInOptionsAPI` | Options API 中使用的函数名 | `'$t'`   |
| `callerInOptionsAPI`       | Options API 中的调用者     | `'this'` |

## 配置优先级

当同时存在通用配置和专用配置时，优先级如下：

**setup 语法：**

1. `functionNameInSetup` > `functionNameInScript`
2. `callerInSetup` > `caller`（如果 `callerInSetup` 未定义，默认为空字符串）
3. `importDeclarationForSetup` > `importDeclaration`
4. `functionSnippetsForSetup` > `functionSnippets`

**Options API：**

1. `functionNameInOptionsAPI` > `functionNameInScript`
2. `callerInOptionsAPI` > `caller`

## 常见场景

### 场景 1：纯 Vue 3 Composition API 项目

```javascript
module.exports = {
  rules: {
    vue: {
      importDeclaration: 'import { useI18n } from "vue-i18n"',
      functionNameInTemplate: 't',
      functionNameInScript: 't',
      functionSnippets: 'const { t } = useI18n()',
      customizeKey: (key) => key,
    },
  },
}
```

### 场景 2：Vue 2 或 Vue 3 Options API 项目

```javascript
module.exports = {
  rules: {
    vue: {
      caller: 'this',
      functionNameInTemplate: '$t',
      functionNameInScript: '$t',
      importDeclaration: '', // 通过 Vue.use 全局注册
      customizeKey: (key) => key,
    },
  },
}
```

### 场景 3：混合使用 setup 和 Options API

```javascript
module.exports = {
  rules: {
    vue: {
      functionNameInTemplate: 't',

      // setup 配置
      functionNameInSetup: 't',
      callerInSetup: '',
      importDeclarationForSetup: 'import { useI18n } from "vue-i18n"',
      functionSnippetsForSetup: 'const { t } = useI18n()',

      // Options API 配置
      functionNameInOptionsAPI: '$t',
      callerInOptionsAPI: 'this',
      importDeclaration: '',

      customizeKey: (key) => key,
    },
  },
}
```

## 注意事项

1. **自动检测**：工具会自动检测文件是使用 `<script setup>` 还是 `<script>`，并应用相应的配置
2. **强制导入**：当 template 中有中文需要转换时，即使 script 本身没有中文，也会自动插入 import 和函数声明
3. **向后兼容**：如果不配置专用选项，会回退到通用配置，保持向后兼容

## 迁移指南

### 从旧配置迁移到新配置

**旧配置（仅支持统一配置）：**

```javascript
rules: {
  vue: {
    caller: '',
    functionNameInScript: 't',
    importDeclaration: 'import { useI18n } from "vue-i18n"',
    functionNameInTemplate: 't',
    functionSnippets: 'const { t } = useI18n()',
  },
}
```

**新配置（支持区分 setup 和 Options API）：**

```javascript
rules: {
  vue: {
    functionNameInTemplate: 't',

    // setup 语法
    functionNameInSetup: 't',
    callerInSetup: '',
    importDeclarationForSetup: 'import { useI18n } from "vue-i18n"',
    functionSnippetsForSetup: 'const { t } = useI18n()',

    // Options API
    functionNameInOptionsAPI: '$t',
    callerInOptionsAPI: 'this',
    importDeclaration: '',
  },
}
```

## 示例项目

查看 `examples/vue-demo/i18n.config.example.js` 获取完整的配置示例。
