const { t } = require('./config')
const { log } = require('console')
const { customAlphabet } = require('nanoid')
const { getRandom, sleep } = require('./utils')
const validatePhoneAlcazar = require('./validatePhoneAlcazar')
const validatePhoneSignalwire = require('./validatePhoneSignalwire')
const validatePhoneNpl = require('./validatePhoneNpl')
const validatePhoneNeutrino = require('./validatePhoneNeutrino')
// const { validatePhoneTwilioV2 } = require('./validatePhoneTwilio')

const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)
const _part2 = customAlphabet('0123456789', 7)

// config
const parallelApiCalls = 5
const waitAfterParallelApiCalls = 1 * 1000 // 1 second

const showProgressEveryXTime = 10 // after every 5 apis calls
const phoneGenTimeout = 60 * 60 * 1000 // 1 hour
const phoneGenStopAtNoXHits = 50 // 50 Hits with 0 phone number found then break the loop

// core
const duplicate = {}
const areaCodeCount = {}
let first = 0

const validateNumber = async (carrier, countryCode, areaCode, cnam) => {
  const part = ['61', '44'].includes(countryCode) ? _part2 : part2
  // validatePhoneNpl can improved to multiple queries in one go, alcazar is already optimized
  const validatePhone = countryCode === '1' ? validatePhoneAlcazar : validatePhoneNpl
  const phone = countryCode + areaCode + part1() + part()

  if (first < parallelApiCalls) {
    log('Phone', phone)
    first++
  }

  if (duplicate[phone]) return log(`Duplicate ${phone}`)
  duplicate[phone] = true

  // neutrino for countries not US
  if (countryCode !== '1') {
    const res0 = await validatePhoneNeutrino(phone)
    if (!res0) return res0
  }

  const res1 = await validatePhone(carrier, phone)
  // log(phone, res1)
  if (!res1) return res1

  if (!cnam) {
    return [res1]
  }

  return [res1, await validatePhoneSignalwire(phone)]
}

const validateNumbersParallel = async (carrier, length, countryCode, areaCode, cnam) => {
  const promises = Array.from({ length }, () => validateNumber(carrier, countryCode, areaCode, cnam))
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
    return []
  }
}

const validateBulkNumbers = async (carrier, phonesToGenerate, countryCode, areaCodes, cnam, bot, chatId) => {
  log({ phonesToGenerate, countryCode, areaCodes, cnam }, '\n')

  let i = 0
  const res = []
  let elapsedTime = 0
  let noHitCount = 0
  const startTime = new Date()

  for (i = 0; res.length < phonesToGenerate; i++) {
    // Gen Phone Numbers and Verify
    const areaCode = areaCodes[getRandom(areaCodes.length)]
    const r = await Promise.all([
      sleep(waitAfterParallelApiCalls),
      validateNumbersParallel(carrier, parallelApiCalls, countryCode, areaCode, cnam),
    ])
    r[1] && res.push(...r[1])

    // Publish Progress
    const progress = t.buyLeadsProgress(res.length > phonesToGenerate ? phonesToGenerate : res.length, phonesToGenerate)

    if (i % showProgressEveryXTime === 0) {
      bot && bot.sendMessage(chatId, progress)
      log(progress)
    }

    // Timeout Checks
    elapsedTime = new Date() - startTime
    if (elapsedTime > phoneGenTimeout) {
      bot && bot.sendMessage(chatId, t.phoneGenTimeout)
      return log(t.phoneGenTimeout, res)
    }
    noHitCount = !r[1] || r[1].length === 0 ? noHitCount + parallelApiCalls : 0
    log({ noHitCount })
    if (noHitCount > phoneGenStopAtNoXHits) {
      bot && bot.sendMessage(chatId, t.phoneGenNoGoodHits)
      return log(t.phoneGenNoGoodHits, res)
    }
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

//
// validateBulkNumbers('T-mobile', 1, '1', ['310'], false).then(log) // US
// validateBulkNumbers(10, '1', ['416'], false).then(log) // Canada
// validateBulkNumbers(1, '61', ['4']) //.then(log) // Australia
// validateBulkNumbers(1, '44', ['77']) //.then(log) // UK
// validateBulkNumbers(1, '64', ['27']) //.then(log) // New Zealand

module.exports = { validateBulkNumbers }
