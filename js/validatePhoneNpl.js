/* global process */
require('dotenv').config()
const axios = require('axios')
const { log } = require('console')

const npl = {
  // New Zealand
  Spark: ['Spark'],
  Vocus: ['Vocus'],
  '2Degrees/Voyager': ['Voyager'],
  'Skinny Mobile': ['Skinny Mobile'],
  // Australia
  Telstra: ['Telstra'],
  Optus: ['Optus'],
  Vodafone: ['VODAFONE', 'Vodafone'],
  // UK
  EE: ['EE'],
  Three: ['Three'],
  'Virgin/O2': ['Virgin'],
}

const validatePhoneNpl = async (carrier, phone) => {
  const request_url = `https://api.numberportabilitylookup.com/npl?user=${process.env.NUMBER_PROBABLITY_API_ID}&pass=${process.env.NUMBER_PROBABLITY_API_PASS}&msisdn=${phone}&format=json`
  const d1 = new Date()
  const res = await axios.get(request_url)
  const d2 = new Date()
  console.log(res?.data)
  // return res?.data?.[0]?.numbertype === 'MOBILE' ? `+${phone} // ${res?.data?.[0]?.carrier} // ` : null
  // landline reachable: 'not_sms_capable', 'true'

  const lec = res?.data?.[0]?.operatorname

  let isMobile = res?.data?.[0]?.mobile === 'true'

  if (phone.startsWith('61') || phone.startsWith('+61')) isMobile = res?.data?.[0]?.validnumber === 'true'

  if (!isMobile) return null

  const filter = carrier === 'Mixed Carriers' ? true : npl[carrier].some(c => lec?.includes(c))
  isMobile && log(phone, lec)

  // return res?.data numbertype

  return isMobile && filter ? [`+${phone}`, lec, `Sec: ${(d2 - d1) / 1000}`] : null
}
// const init = async () => {
//   await validatePhoneNpl('Mixed Carriers','+17134800000') // US
//   await validatePhoneNpl('Mixed Carriers',' +14185200000') // Canada
//  validatePhoneNpl('Mixed Carriers','+6444900000') // New Zealand
// validatePhoneNpl('Mixed Carriers', '+64 27 411 1909').then(console.log) // New Zealand Mobile

//   await validatePhoneNpl('Mixed Carriers','+614 3640 4379') // Australia
//   await validatePhoneNpl('Mixed Carriers','+61 4 0924 8782') // Australia
//   await validatePhoneNpl('Mixed Carriers','+61754331111') // Australia

// validatePhoneNpl('Mixed Carriers', '+61433589141').then(console.log) // Australia Mobile
//   await validatePhoneNpl('Mixed Carriers','+61732900300') // Australia Landline
//   await validatePhoneNpl('Mixed Carriers','+61111000000') // Australia Invalid
// validatePhoneNpl('Mixed Carriers', '+442078300000').then(console.log) // UK
//  validatePhoneNpl('Mixed Carriers','+14039030274') // US Mobile
//  validatePhoneNpl('Mixed Carriers','+16478365790') // US Mobile
// }
// init()
module.exports = validatePhoneNpl
