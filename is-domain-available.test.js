const axios = require('axios');

// Function to test domain availability
async function checkDomainAvailability(domainName) {
  const apiKey = 'iYJ6Q8X2tUNLeT3'; // Replace with your actual API key
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomain?APIKey=${apiKey}&websiteName=${domainName}`;

  try {
    const response = await axios.get(apiUrl);
    const { statusCode } = response.data.responseMsg;
    console.log(response.data);
    if (statusCode === 200) {
      return `Domain ${domainName} is available for purchase!`;
    } else if (statusCode === 400) {
      return `Domain ${domainName} is not available.`;
    } else {
      return `Error checking domain availability.`;
    }
  } catch (error) {
    console.error('Error checking domain availability:', error.message);
    return 'An error occurred while checking domain availability.';
  }
}

// Example usage
async function testDomainAvailability() {
  const domainToCheck = 'gogasoftlota.com'; // Replace with the domain name you want to check
  const result = await checkDomainAvailability(domainToCheck);
  console.log(result);
}

testDomainAvailability(); // Call the function to test domain availability
