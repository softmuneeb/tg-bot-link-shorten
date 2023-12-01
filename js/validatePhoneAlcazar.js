/* global process */
require('dotenv').config()
const axios = require('axios')

const API_ALCAZAR = process.env.API_ALCAZAR
const apiUrl = 'http://api.east.alcazarnetworks.com/api/2.2/lrn'

const validatePhoneAlcazar = async phone => {
  const url = `${apiUrl}?tn=${phone}&extended=true&output=json&&key=${API_ALCAZAR}`
  const res = await axios.get(url)
  // return '+' + phone + ' ' + (res?.data?.LINETYPE === 'WIRELESS')
  return res?.data?.LINETYPE === 'WIRELESS' ? '+' + phone : null
}

// validatePhoneAlcazar('18623752767').then(console.log)
module.exports = validatePhoneAlcazar
