/* global process */
require('dotenv').config()
const axios = require('axios')
const { log } = require('console')

const API_ALCAZAR = process.env.API_ALCAZAR
const apiUrl = 'http://api.east.alcazarnetworks.com/api/2.2/lrn'

const alcazar = {
  'T-mobile': ['T-MOBILE', 'OMNIPOINT', 'METROPCS'],
  'Metro PCS': ['T-MOBILE', 'OMNIPOINT', 'METROPCS'],
  Sprint: ['T-MOBILE', 'OMNIPOINT', 'METROPCS'],
  'Verizon Wireless': ['CELLCO'],
  'AT&T': ['CINGULAR'],
}

const validatePhoneAlcazar = async (carrier, phone) => {
  const url = `${apiUrl}?tn=${phone}&extended=true&output=json&&key=${API_ALCAZAR}`

  const d1 = new Date()
  const res = await axios.get(url)
  const d2 = new Date()
  const lec = res?.data?.LEC

  const filter = carrier === 'Mixed Carriers' ? true : alcazar[carrier].some(c => lec.includes(c))
  res?.data?.LINETYPE === 'WIRELESS' && log(phone, lec)

  // console.log(res.data)
  const result =
    res?.data?.LINETYPE === 'WIRELESS' && filter ? `+${phone} // ${lec} // Sec: ${(d2 - d1) / 1000} // ` : null
  return result
}

// validatePhoneAlcazar('18622039173') // US / Canada
// validatePhoneAlcazar('61385479556') // does not work for Australia, New Zealand, UK

module.exports = validatePhoneAlcazar
