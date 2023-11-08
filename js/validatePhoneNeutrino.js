/* global process */
require('dotenv').config()
const axios = require('axios')
const neutrino_headers = {
  'User-ID': process.env.NEUTRINO_ID,
  'API-Key': process.env.NEUTRINO_KEY,
}
const neutrinoApiUrl = 'https://neutrinoapi.net/phone-validate'
const validatePhoneNeutrino = async number => {
  const res = await axios.post(neutrinoApiUrl, { number }, { headers: neutrino_headers })
  // console.log(res.data)
  return res.data.valid
}
// validatePhoneNeutrino('+16465807362').then(console.log)
module.exports = validatePhoneNeutrino
