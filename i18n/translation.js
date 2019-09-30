const { google, baidu, youdao } = require('translation.js')

/**
 * 翻译
 * https://github.com/Selection-Translator/translation.js
 * youdao, baidu, google
 */
function tranlate (lang, word) {
  // 默认使用Baidu
  return baidu.translate({
    text: word,
    from: 'zh-CN',
    to: lang
  }).then(result => {
    return (result.result[0] || '')
  })
}

exports.tranlate = tranlate

/**
 * 翻译列表
 * 如果其中一个翻译错误，跳过
 * 顺序执行，防止同时开太多进程，程序异常
 */
async function tranlateArr (lang, wordArr) {
  const result = []
  for (let i = 0; i < wordArr.length; i++) {
    const word = wordArr[i]
    const p = tranlate(lang, word).then(res => {
      console.log(word, '\t' + res)
      result[word] = res
    }).catch(err => {
      console.log(err)
    })
    await p
  }
  return result
}

exports.tranlateArr = tranlateArr

// tranlateArr('en', ['您好', '哈哈']).then(res => {
//   console.log(res)
// })
