const { customAlphabet, random } = require('nanoid')
// const validatePhoneNpl = require('./validatePhoneNpl')
const validatePhoneAws = require('./validatePhoneAws')
const { date, getRandom, sleep } = require('./utils')
const { log } = require('console')
// const { log } = require('console')
// const { date } = require('./utils')
const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)

let count = 0
let stop = false
const duplicate = {}

const validateNumber = async (countryCode, areaCode) => {
  const phone = countryCode + areaCode + part1() + part2()

  if (duplicate[phone]) return log(`Duplicate ${phone}`)
  duplicate[phone] = true

  const res = await validatePhoneAws(phone)
  count++

  res?.NumberValidateResponse?.PhoneType === 'MOBILE' &&
    log(`${count}/${phonesToGenerate}, ${date()}, ${phone}, ${res?.NumberValidateResponse?.Carrier}`)
}

const validateNumbersParallel = async (length, countryCode, areaCode) => {
  const promises = Array.from({ length }, () => validateNumber(countryCode, areaCode))
  try {
    const results = (await Promise.all(promises)).filter(r => r)
    return results
  } catch (error) {
    stop = true
    console.error('validateNumbersParallel error', error?.message)
  }
}

// let phonesToGenerate = 5000 * 7 * 2 // 7900/2=3950 good num // 5000 Valid Numbers Needed// * 5 for aws // * 2 for WA
const countryCode = '+1'
const areaCodes = ['310', '212']
const parallelCalls = 20 // calls per second

const validateBulkNumbers = async (bot, phonesToGenerate) => {
  phonesToGenerate *= 7 * 2
  const iterations = phonesToGenerate / parallelCalls
  for (let i = 0; i < iterations; i++) {
    if (stop) break

    const areaCode = areaCodes[getRandom(areaCodes.length)]

    // number of users
    await Promise.all([sleep(1000), validateNumbersParallel(parallelCalls, countryCode, areaCode)])
  }
}

validateBulkNumbers()
module.exports = { validateBulkNumbers }
/* const init = async () => {
  const total = 700 * 5
  for (let i = 0; i < total; i++) {
    const countryCode = '1'
    const areaCode = '305'
    const phone = countryCode + areaCode + part1() + part2()
    // const res1 = await validatePhoneNpl(phone)

    if (duplicate[phone]) {
      log(`Duplicate ${phone}`)
      continue
    }
    duplicate[phone] = true

    const res = await validatePhoneAws(phone)

    const carriers = [
      'T-Mobile USA, Inc.',
      'Verizon Wireless',
      'CSC Wireless, LLC',
      'Onvoy Spectrum, LLC',
      'Dish Wireless, LLC',
      'AT&T Wireless',
     'Fibernetics - SVR',
    ]

    res?.NumberValidateResponse?.PhoneType === 'MOBILE' &&
      log(i + `/${total},` + date() + ', ' + phone + ', ' + res?.NumberValidateResponse?.Carrier)
  }
}

init()*/
