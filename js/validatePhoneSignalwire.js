/* global process */
require('dotenv').config()
const axios = require('axios')
const TOKEN_SIGNALWIRE = process.env.TOKEN_SIGNALWIRE
const validatePhoneSignalwire = async phone => {
  let config = {
    method: 'get',
    url: `https://greetline-llc.signalwire.com/api/relay/rest/lookup/phone_number/%2B${phone}?include=carrier,cnam`, // rem carrier i.e not needed
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${TOKEN_SIGNALWIRE}`,
    },
  }

  const res = await axios(config)
  return res?.data?.cnam?.caller_id || 'Not Found'
}
// validatePhoneSignalwire('16465807362').then(console.log)
module.exports = validatePhoneSignalwire
