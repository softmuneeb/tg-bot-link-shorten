const { t } = require('./config')
const { log } = require('console')
const { customAlphabet } = require('nanoid')
const { getRandom, sleep } = require('./utils')
const validatePhoneAlcazar = require('./validatePhoneAlcazar')
const validatePhoneSignalwire = require('./validatePhoneSignalwire')
const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)

// config
const parallelApiCalls = 5
const waitAfterParallelApiCalls = 1 * 1000 // 1 second

const phoneGenTimeout = 60 * 60 * 1000 // 1 hour

// core
const duplicate = {}
const areaCodeCount = {}

const validateNumber = async (countryCode, areaCode, cnam) => {
  const phone = countryCode + areaCode + part1() + part2()

  if (duplicate[phone]) return log(`Duplicate ${phone}`)
  duplicate[phone] = true

  const res1 = await validatePhoneAlcazar(phone)
  if (!res1) return res1

  if (!cnam) {
    return [res1]
  }

  return [res1, await validatePhoneSignalwire(phone)]
}

const validateNumbersParallel = async (length, countryCode, areaCode, cnam) => {
  const promises = Array.from({ length }, () => validateNumber(countryCode, areaCode, cnam))
  try {
    const results = (await Promise.all(promises)).filter(r => r)

    const a = areaCodeCount[areaCode]
    const totalHits = (a?.totalHits || 0) + length
    const goodHits = (a?.goodHits || 0) + results.length
    const percentage = Number((goodHits / totalHits) * 100).toFixed() + '% Good Hits'
    areaCodeCount[areaCode] = { totalHits, goodHits, percentage }

    return results
  } catch (error) {
    console.error('validateNumbersParallel error', error?.message)
  }
}

const validateBulkNumbers = async (phonesToGenerate, countryCode, areaCodes, cnam, bot, chatId) => {
  log({ phonesToGenerate, countryCode, areaCodes }, '\n')

  let i = 0
  const res = []
  let elapsedTime = 0
  const startTime = new Date()

  for (i = 0; res.length < phonesToGenerate; i++) {
    // Timeout Check
    elapsedTime = new Date() - startTime
    if (elapsedTime > phoneGenTimeout) {
      return log('Timeout', res)
    }

    // Gen Phone Numbers and Verify
    const areaCode = areaCodes[getRandom(areaCodes.length)]
    const r = await Promise.all([
      sleep(waitAfterParallelApiCalls),
      validateNumbersParallel(parallelApiCalls, countryCode, areaCode, cnam),
    ])
    res.push(...r[1])

    // Publish Progress
    const progress = t.buyLeadsProgress(res.length > phonesToGenerate ? phonesToGenerate : res.length, phonesToGenerate)
    bot && bot.sendMessage(chatId, progress)
    log(progress)
  }
  log(
    'elapsedTime',
    elapsedTime / 1000,
    'seconds, total tries',
    i * parallelApiCalls,
    'got',
    res.length,
    'mobile numbers',
    '\nareaCodeCount',
    areaCodeCount,
  ) // send to admin and dev
  return res
}

// validateBulkNumbers(3, '1', ['310']) //.then(log)

module.exports = { validateBulkNumbers }
