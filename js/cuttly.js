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


const sumObjectValues = (obj) => {
  let sum = 0;
  for (let key in obj) {
    if (typeof obj[key] === 'number') {
      sum += obj[key];
    }
  }
  return sum;
}

const analyticsCuttly = async shortUrlHash => {

  const config = {
    method: 'get',
    url: `https://api.promptapi.com/short_url/stats/${shortUrlHash}`,
    headers: {
      'apikey': apiKey
    }
  };

  try {
    const response = await axios(config)
    if (response.status === 200) {
      return sumObjectValues(response.data.device.type);
    } else {
      console.error('Error getting total clicks, Code: ', response?.status)
    }
  } catch (error) {
    return error?.response?.data?.message;
  }

}
// createShortUrlApi('https://google.com').then(console.log)
// analyticsCuttly('vJnro').then(console.log)
module.exports = { createShortUrlApi, analyticsCuttly }
