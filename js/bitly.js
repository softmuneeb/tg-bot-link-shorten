/* global process */
require('dotenv').config()
const axios = require('axios')
const accessToken = process.env.API_BITLY
const bitlyApiUrl = 'https://api-ssl.bitly.com'

const createShortBitly = async longUrl => {
  const response = await axios.post(
    bitlyApiUrl + '/v4/shorten',
    {
      long_url: longUrl,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const shortUrl = response.data.id
  return shortUrl
}
const analyticsBitly = async shortUrl => {
  const response = await axios.get(
    bitlyApiUrl + '/bitlinks',
    {
      bitlink: shortUrl,
      unit: 'day',
      units: -1,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  console.log(response.data)
}
analyticsBitly('bit.ly/12a4b6c').catch(e => console.log(e?.response?.data))
module.exports = createShortBitly
