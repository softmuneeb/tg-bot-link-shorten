const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const API_KEY = process.env.API_KEY_CONNECT_RESELLER;

// Function to test domain availability
async function checkDomainPriceOnline(domainName) {
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomainPrice?APIKey=${API_KEY}&websiteName=${domainName}`;

  let response;

  try {
    response = await axios.get(apiUrl);
    const { statusCode } = response.data.responseMsg;

    if (statusCode === 200) {
      const [domainId] = Object.keys(response.data.responseData);
      console.log(domainId);
      const registrationPrice1Year = Number(
        response.data.responseData[domainId]
          .find(entry =>
            entry.description.includes('Registration Price for 1 Year'),
          )
          .description.split('is ')[1],
      );

      return { available: true, price: registrationPrice1Year };
    } else if (statusCode === 400) {
      return {
        available: false,
        message: 'domain name not available please try another domain name',
      };
    } else {
      return { available: false, message: 'invalid domain name' };
    }
  } catch (error) {
    console.error(
      JSON.stringify(response?.data, null, 2),
      'Error checking domain availability:',
      error.message,
    );
    return {
      available: false,
      message: `An error occurred while checking domain availability. ${error.message}`,
    };
  }
}

// Example usage
async function testDomainAvailability() {
  const domainToCheck = 'softbluepink.live'; // Replace with the domain name you want to check
  const result = await checkDomainPriceOnline(domainToCheck);
  console.log(result);
}

// testDomainAvailability(); // Call the function to test domain availability

module.exports = { checkDomainPriceOnline };
