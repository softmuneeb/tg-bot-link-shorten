const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const API_KEY = process.env.API_KEY_CONNECT_RESELLER;

// Function to test domain availability
async function checkDomainAvailabilityOnline(domainName) {
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomain?APIKey=${API_KEY}&websiteName=${domainName}`;

  try {
    const response = await axios.get(apiUrl);
    const { statusCode } = response.data.responseMsg;
    console.log(response.data);
    if (statusCode === 200) {
      console.error(`Domain ${domainName} is available for purchase!`);
      return true;
    } else if (statusCode === 400) {
      console.error(`Domain ${domainName} is not available.`);
      return false;
    } else {
      console.error(
        `Error checking domain availability. statusCode ${statusCode}`,
      );
      return false;
    }
  } catch (error) {
    console.error('Error checking domain availability:', error.message);
    return false;
  }
}

// Example usage
async function testDomainAvailability() {
  const domainToCheck = 'softblue.sbs'; // Replace with the domain name you want to check
  const result = await checkDomainAvailabilityOnline(domainToCheck);
  console.log(result);
}

// testDomainAvailability(); // Call the function to test domain availability

module.exports = { checkDomainAvailabilityOnline };
