/* global process */
require('dotenv').config()
const axios = require('axios')

const validatePhoneNpl = async phone => {
  const request_url = `https://api.numberportabilitylookup.com/npl?user=${process.env.NUMBER_PROBABLITY_API_ID}&pass=${process.env.NUMBER_PROBABLITY_API_PASS}&msisdn=${phone}&format=json`
  const res = await axios.get(request_url)
  // console.log(res?.data)
  // return res?.data?.[0]?.numbertype === 'MOBILE' ? `+${phone} // ${res?.data?.[0]?.carrier} // ` : null
  // reachable: 'not_sms_capable', 'true'
  return res?.data?.[0]?.validnumber === 'true' ? `+${phone} // ${res?.data?.[0]?.operatorname} // ` : null
  // return res?.data numbertype
}
// const init = async () => {
//   await validatePhoneNpl('+17134800000') // US
//   await validatePhoneNpl(' +14185200000') // Canada
//   await validatePhoneNpl('  +6444900000') // New Zealand
//   await validatePhoneNpl('+614 3640 4379') // Australia
//   await validatePhoneNpl('+61 4 0924 8782') // Australia
//   await validatePhoneNpl('+61754331111') // Australia

//   await validatePhoneNpl('+61433589141') // Australia Mobile
//   await validatePhoneNpl('+61732900300') // Australia Landline
//   await validatePhoneNpl('+61111000000') // Australia Invalid
//   await validatePhoneNpl('+442078300000') // UK
// }
// init()
module.exports = validatePhoneNpl
