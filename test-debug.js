const { parse } = require('@vue/compiler-sfc')
const fs = require('fs')

const code = fs.readFileSync('./examples/vue-demo/src/App.vue', 'utf-8')
const { descriptor } = parse(code)

console.log('script:', descriptor.script)
console.log('scriptSetup:', descriptor.scriptSetup)
console.log('scriptSetup.setup:', descriptor.scriptSetup?.setup)
