/* global process */
require('dotenv').config()
const axios = require('axios')
const apiKey = process.env.API_AP1

const createShortUrlApi = async longUrl => {
  const apiUrl = `https://api.promptapi.com/short_url/hash`
  const response = await axios.post(apiUrl, longUrl, {
    headers: {
      apikey: apiKey,
    },
  })

  const shortLink = response.data.short_url
  if (response.status === 200) {
    return shortLink
  } else {
    console.error('Error creating short URL, Code: ', response?.status)
  }
}
// createShortUrlApi('https://web.telegram.org/k/#@softlocalbot').then(console.log)
module.exports = createShortUrlApi
