/* global process */
require('dotenv').config()
const axios = require('axios')

const validatePhoneNpl = async phone => {
  const request_url = `https://api.numberportabilitylookup.com/npl?user=${process.env.NUMBER_PROBABLITY_API_ID}&pass=${process.env.NUMBER_PROBABLITY_API_PASS}&msisdn=${phone}&format=json`
  const res = await axios.get(request_url)
  // console.log(res?.data)
  // return res?.data?.[0]?.errorcode === '0'
  return res?.data
}
// validatePhoneNpl('+16465807362').then(console.log)
module.exports = validatePhoneNpl
