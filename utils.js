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
  // Implement logic to determine if the user is a normal user
  // Return true if the user is a normal user, false otherwise
  return !isAdmin(chatId) && !isDeveloper(chatId);
}

function isDeveloper(chatId) {
  // Implement logic to determine if the user is a developer
  // Return true if the user is a developer, false otherwise
  return chatId === process.env.TELEGRAM_DEVELOPER_CHAT_ID; // Replace with the actual developer's chat ID
}

function isAdmin(chatId) {
  // Implement logic to determine if the user is the admin
  // Return true if the user is the admin, false otherwise
  return chatId === Number(process.env.TELEGRAM_ADMIN_CHAT_ID); // Replace with the actual admin's chat ID
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

function getShortenedLinks(chatId, linksOf, clicksOn) {
  return !linksOf[chatId]
    ? []
    : linksOf[chatId].map(
        d =>
          `${clicksOn[d.shortenedURL] || 0} ${
            clicksOn[d.shortenedURL] === 1 ? 'click' : 'clicks'
          } → ${d.shortenedURL} → ${d.url}\n`,
      );
}
function shortenURLAndSave(chatId, domain, url, linksOf, fullUrlOf) {
  const shortenedURL = domain + '/' + nanoid();
  const data = { url, shortenedURL };
  linksOf[chatId] = linksOf[chatId] ? linksOf[chatId].concat(data) : [data];
  fullUrlOf[shortenedURL] = url;
  return shortenedURL;
}

// convertUSDToNaira(1)
module.exports = {
  shortenURLAndSave,
  getShortenedLinks,
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
