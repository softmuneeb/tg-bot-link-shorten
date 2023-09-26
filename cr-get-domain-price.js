require('dotenv').config();
const axios = require('axios');
const API_KEY = process.env.API_KEY_CONNECT_RESELLER;

// Function to test domain availability
async function checkDomainPriceOnline(domainName) {
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomainPrice?APIKey=${API_KEY}&websiteName=${domainName}`;

  let response;

  try {
    response = await axios.get(apiUrl);
    const statusCode = response?.data?.responseMsg?.statusCode;

    if (statusCode === 200) {
      const [domainId] = Object.keys(response.data.responseData);
      const price1Year = Number(
        response?.data?.responseData[domainId]
          ?.find(entry => entry.description.includes('Registration Price for 1 Year'))
          .description.split('is ')[1],
      );

      const price = Math.ceil(price1Year + price1Year * 1.2); //20% profit
      return { available: true, price };
    } else if (statusCode === 400) {
      return {
        available: false,
        message: 'domain name not available please try another domain name',
      };
    } else {
      return { available: false, message: 'invalid domain name' };
    }
  } catch (error) {
    const message = `An error occurred while checking domain availability. Maybe IP Not Whitelisted. ${error.message}`;
    console.error('checkDomainPriceOnline', JSON.stringify(response?.data, null, 2), message);
    return {
      available: false,
      message,
    };
  }
}

module.exports = { checkDomainPriceOnline };
