/**
 * 根据配置的根文件夹（rootDir）
 * 根据配置的规则数组，文件匹配规则
 * 根据配置的提出国际化的正则数组，比如：/(?:\$)?t\(['"](.+?)['"]/g
 * 根据配置的输出目录，输出国际化
 * 根据配置的输出国际化语言列表
 * 配置文件目录
 * 配置文件不生效
 */
/**
 * 示例命令
 * 【抽取全部模块】npm run i18n
 * 【抽离某个模块】npm run i18n -- -m eweb-setting-safe
 * 【翻译】npm run i18n -- -m eweb-setting-safe -t
 * 【强制翻译】npm run i18n -- -m eweb-setting-safe -t -F
 * 【强制翻译某种语言】npm run i18n -- -m eweb-setting-safe -t -F -L en
 */
'use strict'
const program = require('commander');
const jsonfile = require('jsonfile')
const utils = require('./utils')
const trans = require('./translation') // trans
const { loadConfig, findConfigUpwards } = require('./configuration')
const vfs = require('vinyl-fs')
const map = require('map-stream')
const path = require('path')
const fs = require('fs');
const uniq = require('lodash.uniq')

function commaSeparatedList(value, split = ',') {
  return value.split(split).filter(item => item);
}

program
  .version('1.0.0')
  .option('--root-dir <path>', '提交国际化文本的根目录')
  .option('--files <items>', '文件规则，指定哪些文件中的规则化文本需要被提取')
  .option('--regulars <items>', '国际化文本的正则表达式，正则中第一个捕获对象当做国际化文本', commaSeparatedList)
  .option('--out-dir <path>', '生成的国际化资源包的输出目录')
  .option('--languages <items>', '需要生成的国际化语言文件，目前支持zh、en多个用逗号分割，默认全部', commaSeparatedList)
  .option('--config <path>', '配置文件路径')
  .option('--no-config', '忽略rc配置文件')
  .option('--module [name]', '模块名称，已eweb开头')
  .option('-t, --translate', '是否使用翻译，默认翻译新增的文本，只能再bash环境下，window环境需要再git bash环境下执行')
  .option('--force-translate', '强制翻译所有的内容')
  .option('--translate-language <items>', '配合--translate使用，需要翻译的语言，目前支持en、ko，多个用逗号分割，默认全部', commaSeparatedList)
  .parse(process.argv);

const config = {
  cwd: '.',
  rootDir: '.',
  files: [],
  regulars: [],
  outDir: '',
  languages: ['zh', 'en'],
  config: '',
  noConfig: false,
  translate: false,
  forceTranslate: false,
  translateLanguage: []
}

Object.assign(config, program)

const CONFIG_JS_FILENAME = "vve-i18n-cli.config.js";

const absoluteCwd = path.resolve(config.cwd);

// 优先判断是否需要读取文件
if (!config.noConfig) {
  let configFilePath = path.join(absoluteCwd, CONFIG_JS_FILENAME)
  if (config.config) {
    configFilePath = path.resolve(config.config)
  }
  if (fs.existsSync(configFilePath)) {
    const conf = loadConfig(configFilePath)
    if (conf) {
      Object.assign(config, conf.options, program)
    }
  }
}

const absoluteRootDir = path.resolve(absoluteCwd, config.rootDir);

// const pathResolve = utils.pathResolve
// const fsExistsSync = utils.fsExistsSync
// const copyFile= utils.copyFile
// const filterObjByKeyRules = utils.filterObjByKeyRules
// const tranlateArr = trans.tranlateArr

// // 模块的国际化的json文件需要被保留下的key，即使这些组件在项目中没有被引用
// // key可以是一个字符串，正则，或者是函数
// const MODULE_KEEP_KEY_RULES = [
//   /^G\/+/ // G/开头的会被保留
// ]

// // 匹配正则
// const regexps = {
//   regI18n: /(?:\$)?t\(['"](.+?)['"]/g,
// }

// const I18N_TYPES = [
//   'zh', // 中文
//   'en', // 英文
// ]

// const i18nData = {}
// const tmpRegData = {}

// // 从文件中提取模块的的国际化KEY
// function getModuleI18nData (modulePath, fileContent) {
//   const regI18n = new RegExp(regexps.regI18n)
//   if (!i18nData[modulePath]) {
//     i18nData[modulePath] = []
//   }
//   while ((tmpRegData.matches = regI18n.exec(fileContent))) {
//     i18nData[modulePath].push(tmpRegData.matches[1])
//   }
// }

// // 删除重复的key，并排序方便git比对
// function normalizeI18nData () {
//   const moduleKeys = Object.keys(i18nData)
//   moduleKeys.forEach(key => {
//     i18nData[key] = uniq(i18nData[key]).sort()
//   })
// }

// // 根据旧数据，生成新数据
// async function makeNewData (key, lang, originData) {
//   const newData = filterObjByKeyRules(originData, MODULE_KEEP_KEY_RULES) // 根据配置保留一些keys值，保证即使在项目中不被引用也能保存下来
  
//   let newAddDataArr = [] // 新增的数据，即在旧的翻译文件中没有出现
  
//   i18nData[key].forEach(key => {
//     if (originData.hasOwnProperty(key)) {
//       newData[key] = originData[key]
//     } else {
//       newData[key] = key
//       newAddDataArr.push(key)
//     }
//   })

//   // 中文的不翻译
//   if (program.translate && lang !== 'zh') {
//     let tranlateRst = {}

//     // 如果强制翻译，则翻译所有的key
//     if (program.forceTranslate) {
//       newAddDataArr= Object.keys(newData)
//     }

//     // 配合--translate使用，需要翻译的语言，目前支持en、ko，多个用逗号分割，默认全部
//     if (!program.translateLanguage) {
//       tranlateRst = await tranlateArr(lang, newAddDataArr)
//     } else if (program.translateLanguage.includes(lang)) {
//       tranlateRst = await tranlateArr(lang, newAddDataArr)
//     }
//     Object.assign(newData, tranlateRst)
//   }
//   return newData
// }

// // 保存国际化文件
// async function saveI18nFile({
//   dirPath,
// } = {}) {
//   const i18nTypes = program.language ? I18N_TYPES.filter(item => program.language.includes(item)) : I18N_TYPES

//   for (let i = 0; i < i18nTypes.length; i++) {
//     const item = i18nTypes[i]
//     const i18nDir =  path.resolve(dirPath, 'i18n')
//     if (!fsExistsSync(i18nDir)) {
//       fs.mkdirSync(i18nDir);
//     }

//     // 模块下i18n/index.js文件不存在才拷贝index.js，或者forceCopyIndex=true强制拷贝
//     const i18nIndexFile = path.resolve(i18nDir, 'index.js')
//     if (!fsExistsSync(i18nIndexFile) || program.forceCopyIndex) {
//       copyFile(pathResolve.root('config/i18n/res/index.js'), i18nIndexFile)
//     }

//     // 没有对应语言的国际化文件，就创建一个
//     const langFilePath = path.resolve(i18nDir, item + '.json')
//     if (!fsExistsSync(langFilePath)) {
//       jsonfile.writeFileSync(langFilePath, {}, { spaces: 2, EOL: '\n' })
//     }

//     // 读取原有的国际化文件信息，重新与新收集的国际化信息合并
//     const originData = jsonfile.readFileSync(langFilePath) || {}
//     const newData = await makeNewData(dirPath, item, originData)

//     // 写文件
//     jsonfile.writeFile(langFilePath, newData, { spaces: 2, EOL: '\n' }, err => {
//       if (err) return console.log('提取失败' + langFilePath + '\n' + err)
//       console.log('提取完成' + langFilePath)
//     })
//   }
// }

// // 保存模块的I18n文件
// function saveModuleI18nFile() {
//   const moduleKeys = Object.keys(i18nData)
//   moduleKeys.forEach(key => {
//     saveI18nFile({ dirPath: key })
//   })
// }

// // pathResolve.root('**/eweb-demo/**/pro.properties'),
// // 默认所有模块，如果有传module参数，就只处理某个模块
// let moduleProPath = pathResolve.root('**/eweb-**/**/pro.properties')
// if (program.module && typeof (program.module) === 'string') {
//   moduleProPath = pathResolve.root('**/' + program.module + '/**/pro.properties')
// }

// vfs.src([
//   moduleProPath
// ], {
//   dot: false
// }).pipe(map((file, cb) => {
//   const modulePath = path.resolve(file.path, '..')
//   vfs.src([
//     path.resolve(modulePath, '**/*.+(vue|js)') //
//   ], {dot: false}).pipe(map((file, cb) => {
//     const contents = file.contents.toString()
//     getModuleI18nData(modulePath, contents)
//     cb(null)
//   })).on('end', () => {
//     cb(null)
//   })
// })).on('end', () => {
//   normalizeI18nData()
//   saveModuleI18nFile()
// })
