const validatePhoneAws = require('./validatePhoneAws')
const validatePhoneNpl = require('./validatePhoneNpl')
const validatePhoneNeutrino = require('./validatePhoneNeutrino')
const { customAlphabet } = require('nanoid')
const { log } = require('console')
const validatePhoneTwilioV1 = require('./validatePhoneTwilioV1')
const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)

const validatePhone = async () => {
  const countryCode = '+1'
  const areaCode = '862' // hit rate is very good, maintain hit rate, maintain duplicate generation, avoid api calls for duplicates, maintain duplicate gen rate

  const phone = countryCode + areaCode + part1() + part2()
  const res1 = await validatePhoneNeutrino(phone)
  const res2 = res1 && (await validatePhoneNpl(phone))
  const res3 = res2 && (await validatePhoneAws(phone))
  const res4 = res3 && (await validatePhoneTwilioV1(phone))

  log(`${phone}, ${res1}, ${res2}, ${res3}, ${res4}, ${new Date()}`)
}

const validatePhones = async () => {
  log('phone, Neutrino, Npl, Aws, Twilio')

  for (let i = 0; i < 100; i++) {
    await validatePhone()
  }
}

validatePhones()
