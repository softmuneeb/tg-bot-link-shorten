const validatePhoneAws = require('./validatePhoneAws')
const validatePhoneNpl = require('./validatePhoneNpl')
const validatePhoneNeutrino = require('./validatePhoneNeutrino')
const { customAlphabet } = require('nanoid')
const { log } = require('console')
const validateCnamTwilio = require('./validateCnamTwilio')
const { sleep } = require('./utils')
const { t } = require('./config')
const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)

const validatePhoneTest = async () => {
  const countryCode = '+1'
  const areaCode = '862' // hit rate is very good, maintain hit rate, maintain duplicate generation, avoid api calls for duplicates, maintain duplicate gen rate

  const phone = countryCode + areaCode + part1() + part2()
  const res1 = await validatePhoneNeutrino(phone)
  const res2 = res1 && (await validatePhoneNpl(phone))
  const res3 = res2 && (await validatePhoneAws(phone))
  const res4 = res3 && (await validateCnamTwilio(phone))

  log(`${phone}, ${res1}, ${res2}, ${res3}, ${res4}, ${new Date()}`)
}

const validatePhonesTest = async () => {
  log('phone, Neutrino, Npl, Aws, Twilio')

  for (let i = 0; i < 100; i++) {
    await validatePhoneTest()
  }
}
0 && validatePhonesTest()

const validatePhones = async (amount, bot, chatId) => {
  await sleep(1000)
  bot.sendMessage(chatId, t.buyLeadsProgress(12, 20))
  await sleep(1000)
  const result = `+13107437344
+13104303342
+13102663797
+13105052552
+13104097954
+13105146045
+13104316094
+13109711210
+13107398313
+13104670451
+13103870952
+13106996582
+13105976935
+13103592440
+13108070087
+13109220320
+13109027791
+13105614219
+13105651683
+13103923339
+13109660944
+13109365331
+13107387496
+13109532424`

  return result
}

module.exports = { validatePhones }
