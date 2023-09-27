require('dotenv').config();

const axios = require('axios');
const os = require('os');

const { checkDomainPriceOnline } = require('./cr-get-domain-price');

const API_KEY_CURRENCY_EXCHANGE = process.env.API_KEY_CURRENCY_EXCHANGE;

function isValidUrl(url) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
  return urlRegex.test(url);
}

function isNormalUser(chatId) {
  return !isAdmin(chatId) && !isDeveloper(chatId);
}

function isDeveloper(chatId) {
  return chatId === process.env.TELEGRAM_DEVELOPER_CHAT_ID; // Replace with the actual developer's chat ID
}

function isAdmin(chatId) {
  return chatId === Number(process.env.TELEGRAM_ADMIN_CHAT_ID); // Replace with the actual admin's chat ID
}

async function checkDomainAvailability(domain, domainSold) {
  if (domainSold[domain]) {
    return { available: false, message: 'Domain is already sold, try another' };
  }

  return await checkDomainPriceOnline(domain);
}

async function convertUSDToNaira(amountInUSD) {
  try {
    const apiUrl = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY_CURRENCY_EXCHANGE}`;

    const response = await axios.get(apiUrl);
    const usdToNairaRate = response.data.rates['NGN']; // Get the exchange rate for USD to Naira

    const nairaAmount = amountInUSD * usdToNairaRate * 1.15;
    // increase 15% as per client requirement
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
function today() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Note: Months are 0-indexed
  const year = currentDate.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
}
function week() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7);

  return year() + ' Week ' + weekNumber;
}

function month() {
  const currentDate = new Date();
  return year() + ' Month ' + (currentDate.getMonth() + 1);
}
function year() {
  const currentDate = new Date();
  return 'Year ' + currentDate.getFullYear();
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// convertUSDToNaira(1)
module.exports = {
  isValidEmail,
  today,
  week,
  month,
  year,
  getLocalIpAddress,
  convertUSDToNaira,
  getPrice,
  checkDomainAvailability,
  isValidUrl,
  isNormalUser,
  isDeveloper,
  isAdmin,
};
