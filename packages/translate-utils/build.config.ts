import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    cjsBridge: true,
  },
  hooks: {
    'build:done': async (ctx) => {
      // 复制 index.cjs 到 index.js 以保持向后兼容
      const fs = await import('fs/promises')
      const path = await import('path')
      const distPath = ctx.options.outDir
      const cjsPath = path.join(distPath, 'index.cjs')
      const jsPath = path.join(distPath, 'index.js')
      await fs.copyFile(cjsPath, jsPath)
      console.log('✓ 已生成 index.js (从 index.cjs 复制)')
    },
  },
})
