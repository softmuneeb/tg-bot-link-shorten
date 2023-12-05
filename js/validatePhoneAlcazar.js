/* global process */
require('dotenv').config()
const axios = require('axios')

const API_ALCAZAR = process.env.API_ALCAZAR
const apiUrl = 'http://api.east.alcazarnetworks.com/api/2.2/lrn'

const validatePhoneAlcazar = async phone => {
  const url = `${apiUrl}?tn=${phone}&extended=true&output=json&&key=${API_ALCAZAR}`
  const res = await axios.get(url)
  // console.log(res.data)
  // return '+' + phone + ' ' + (res?.data?.LINETYPE === 'WIRELESS')
  return res?.data?.LINETYPE === 'WIRELESS' ? `+${phone} // ${res?.data?.LEC} // ` : null
  // return res?.data?.LEC
}

// validatePhoneAlcazar('18622039173') // US / Canada 
// validatePhoneAlcazar('61385479556') // does not work for Australia, New Zealand, UK

module.exports = validatePhoneAlcazar
