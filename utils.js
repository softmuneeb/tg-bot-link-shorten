require('dotenv').config();

const axios = require('axios');
const os = require('os');

const { checkDomainPriceOnline } = require('./cr-get-domain-price');

const API_KEY_CURRENCY_EXCHANGE = process.env.API_KEY_CURRENCY_EXCHANGE;

const DEVELOPER_CHAT_ID = 5729797630;
const ADMIN_CHAT_ID = 5729797630;

function isValidUrl(url) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
  return urlRegex.test(url);
}

function isNormalUser(chatId) {
  // Implement logic to determine if the user is a normal user
  // Return true if the user is a normal user, false otherwise
  return !isAdmin(chatId) && !isDeveloper(chatId);
}

function isDeveloper(chatId) {
  // Implement logic to determine if the user is a developer
  // Return true if the user is a developer, false otherwise
  return chatId === DEVELOPER_CHAT_ID; // Replace with the actual developer's chat ID
}

function isAdmin(chatId) {
  // Implement logic to determine if the user is the admin
  // Return true if the user is the admin, false otherwise
  return chatId === ADMIN_CHAT_ID; // Replace with the actual admin's chat ID
}

async function checkDomainAvailability(domain, domainSold) {
  if (domainSold[domain]) {
    return { available: false, message: 'Domain is already sold, try another' };
  }

  return await checkDomainPriceOnline(domain);
}

function getPrice(domainName) {
  // Implement logic to get the price of the domain
  // Return the price of the domain
  return 1; // Replace with the actual logic
}

async function convertUSDToNaira(amountInUSD) {
  try {
    const apiUrl = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY_CURRENCY_EXCHANGE}`;

    const response = await axios.get(apiUrl);
    const usdToNairaRate = response.data.rates['NGN']; // Get the exchange rate for USD to Naira

    const nairaAmount = amountInUSD * usdToNairaRate;
    // console.log(`Equivalent amount in Naira: ${nairaAmount.toFixed(2)}`);
    return nairaAmount.toFixed(2);
  } catch (error) {
    console.error(`Error converting currency: ${error.message}`);
    return error.message;
  }
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  let ipAddress;

  for (const key in interfaces) {
    for (const iface of interfaces[key]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
    if (ipAddress) break;
  }

  return ipAddress;
}
// convertUSDToNaira(1)
module.exports = {
  getLocalIpAddress,
  convertUSDToNaira,
  getPrice,
  checkDomainAvailability,
  isValidUrl,
  isNormalUser,
  isDeveloper,
  isAdmin,
};
