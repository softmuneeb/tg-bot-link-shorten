/* global process */
require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.API_KEY_CONNECT_RESELLER
const PERCENT_INCREASE_DOMAIN = 1 + Number(process.env.PERCENT_INCREASE_DOMAIN)

// Function to test domain availability
async function checkDomainPriceOnline(domainName) {
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomainPrice?APIKey=${API_KEY}&websiteName=${domainName}`

  let response

  try {
    response = await axios.get(apiUrl)
    const statusCode = response?.data?.responseMsg?.statusCode
    // console.log(JSON.stringify(response?.data, 0, 2))

    if (statusCode === 200) {
      const premiumPrice = response?.data?.responseData?.domainCheckResponce?.[0]?.creationSellFee
      // console.log(JSON.stringify(response.data, 0, 2))
      if (premiumPrice) return { available: true, price: premiumPrice, originalPrice: premiumPrice }
      const [domainId] = Object.keys(response.data.responseData)
      const price1Year = Number(
        response?.data?.responseData?.[domainId]
          ?.find(entry => entry?.description?.toLowerCase()?.includes('registration price for 1 year'))
          ?.description?.split('is ')?.[1],
      )

      if (isNaN(price1Year)) {
        return {
          available: false,
          message: 'Some issue, can not get price, error code 110',
        }
      }

      const price = Math.ceil(price1Year * PERCENT_INCREASE_DOMAIN)
      return { available: true, originalPrice: price1Year, price: price > 5 ? price : 6 }
    } else if (statusCode === 400) {
      return {
        available: false,
        message: 'Domain name not available, please try another domain name',
      }
    } else {
      return { available: false, message: 'Invalid domain name, please try another domain name' }
    }
  } catch (error) {
    const message = `An error occurred while checking domain availability. Maybe IP Not Whitelisted. ${
      error?.message
    } ${JSON.stringify(error?.response?.data, null, 2)}`

    console.error('checkDomainPriceOnline', message)

    return {
      available: false,
      message,
    }
  }
}
// checkDomainPriceOnline('usetraderep.com').then(console.log)

module.exports = { checkDomainPriceOnline }
