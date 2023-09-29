// TODO: keep in eye data types Number vs String may give bugs...

const { getRegisteredDomainNames } = require('./get-purchased-domains.test.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const { createCheckout } = require('./fincra.js');
const { customAlphabet } = require('nanoid');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const {
  priceOf,
  aO,
  dO,
  o,
  paymentOptions,
  subscriptionOptions,
  cryptoTransferOptions,
  timeOf,
  chooseSubscription,
  rem,
  pay,
  bc,
  linkType,
  payBank,
  linkOptions,
} = require('./config.js');
const {
  isValidUrl,
  isDeveloper,
  isAdmin,
  convertUSDToNaira,
  today,
  week,
  month,
  year,
  isValidEmail,
} = require('./utils.js');
const { getCryptoDepositAddress, convertUSDToCrypto } = require('./blockbee.js');
const { saveDomainInServer } = require('./cr-rl-connect-domain-to-server.js');
const { saveServerInDomain } = require('./cr-add-dns-record.js');
const { buyDomainOnline } = require('./register-domain.test.js');
const { get, set, del, increment, getAll } = require('./db.js');
const { log } = require('console');
const { checkDomainPriceOnline } = require('./cr-get-domain-price.js');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);
process.env['NTBA_FIX_350'] = 1;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SELF_URL = process.env.SELF_URL;
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log('Bot is running...');

// variables to implement core functionality
let state = {};
let linksOf = {};
let fullUrlOf = {};
let domainsOf = {};
let chatIdBlocked = {};
let planEndingTime = {};
let chatIdOfPayment = {};
let totalShortLinks = { count: 0 };

// variables to view system information
let payments = {};
let clicksOf = {};
let clicksOn = {};
let chatIdOf = {};
let nameOf = {};
let planOf = {};

let connect_reseller_working = false;
// restoreData();
// manually data add here or call methods

let db;
const dbName = 'domainSellBot16';

const client = new MongoClient(process.env.MONGO_URL);

client
  .connect()
  .then(async () => {
    db = client.db(dbName);

    // variables to implement core functionality
    state = db.collection('state');
    linksOf = db.collection('linksOf');
    fullUrlOf = db.collection('fullUrlOf');
    domainsOf = db.collection('domainsOf');
    chatIdBlocked = db.collection('chatIdBlocked');
    planEndingTime = db.collection('planEndingTime');
    chatIdOfPayment = db.collection('chatIdOfPayment');
    totalShortLinks = db.collection('totalShortLinks');

    // variables to view system information
    payments = db.collection('payments');
    clicksOf = db.collection('clicksOf');
    clicksOn = db.collection('clicksOn');
    chatIdOf = db.collection('chatIdOf');
    nameOf = db.collection('nameOf');
    planOf = db.collection('planOf');
    console.log('DB Connected lala');
  })
  .catch(err => console.log('DB Connected', err, err?.message));

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  console.log('command\t' + message + '\t' + chatId + '\t' + msg.from.username);

  if (!db) {
    bot.sendMessage(chatId, 'Bot starting, please wait');
    return;
  }

  const nameOfChatId = await get(nameOf, chatId);
  const username = nameOfChatId || msg.from.username || nanoid();

  if (!connect_reseller_working) {
    tryConnectReseller();
  }

  const blocked = await get(chatIdBlocked, chatId);
  if (blocked) {
    bot.sendMessage(chatId, `You are currently blocked from using the bot. Please contact ${SUPPORT_USERNAME}`, rem);
    return;
  }

  if (!nameOfChatId) {
    // set(state, chatId, {});
    set(nameOf, chatId, username);
    set(chatIdOf, username, chatId);
  }

  const action = (await get(state, chatId))?.action;

  const firstSteps = ['block-user', 'unblock-user', 'choose-domain', 'choose-domain-to-buy', 'choose-subscription'];

  if (message === '/start') {
    if (isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Hello, Admin! Please select an option:', aO);
    } else if (isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Welcome, Developer! Choose an option:', dO);
    } else {
      bot.sendMessage(chatId, 'Thank you for choosing the URL Shortener Bot! Please choose an option:', o);
    }

    return;
  }
  //
  if (message === 'Cancel' || (firstSteps.includes(action) && message === 'Back')) {
    set(state, chatId, 'action', 'none');
    bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
    return;
  }
  //
  if (message === 'Block User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, 'Please share the username of the user that needs to be blocked.', bc);

    set(state, chatId, 'action', 'block-user');
    return;
  }
  if (action === 'block-user') {
    const userToBlock = message;

    const chatIdToBlock = await get(chatIdOf, userToBlock);

    if (!chatIdToBlock) {
      bot.sendMessage(chatId, `User ${userToBlock} not found`, bc);
      return;
    }

    set(chatIdBlocked, chatIdToBlock, true);
    bot.sendMessage(chatId, `User ${userToBlock} has been blocked.`, aO);
    set(state, chatId, 'action', 'none');
    return;
  }
  //
  if (message === 'Unblock User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, 'Please share the username of the user that needs to be unblocked.', bc);
    set(state, chatId, 'action', 'unblock-user');

    return;
  }
  if (action === 'unblock-user') {
    const userToUnblock = message;
    const chatIdToUnblock = await get(chatIdOf, userToUnblock);
    if (!chatIdToUnblock) {
      bot.sendMessage(chatId, `User ${userToUnblock} not found`, bc);
      return;
    }

    set(chatIdBlocked, chatIdToUnblock, false);
    bot.sendMessage(chatId, `User ${userToUnblock} has been unblocked.`, aO);
    set(state, chatId, 'action', 'none');
    return;
  }
  //
  //
  if (message === '🔗 URL Shortener') {
    if (!(await isSubscribed(chatId))) {
      bot.sendMessage(chatId, '📋 Subscribe first');
      return;
    }
    if (!(await ownsDomainName(chatId))) {
      bot.sendMessage(chatId, '🌐 Buy domain names first');
      return;
    }
    set(state, chatId, 'action', 'choose-domain');
    bot.sendMessage(chatId, 'Kindly share the URL that you would like to have shortened.', bc);
    return;
  }
  if (action === 'choose-domain') {
    if (!isValidUrl(message)) {
      bot.sendMessage(chatId, 'Please provide a valid URL. e.g https://google.com', bc);
      return;
    }

    const domains = await getPurchasedDomains(chatId);
    const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
    bot.sendMessage(chatId, `Please select the domain you would like to connect with your shortened link.`, {
      reply_markup: {
        keyboard,
      },
    });
    set(state, chatId, 'action', 'shorten');
    set(state, chatId, 'url', message);
    return;
  }
  if (action === 'shorten') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-domain');
      bot.sendMessage(chatId, `Please choose the URL to shorten.`, bc);
      return;
    }

    const domains = await getPurchasedDomains(chatId);
    if (!domains.includes(message)) {
      bot.sendMessage(chatId, 'Please choose a valid domain', bc);
      return;
    }
    set(state, chatId, 'selectedDomain', message);

    bot.sendMessage(chatId, `Choose link type:`, linkType);
    set(state, chatId, 'action', 'choose-link-type');
    return;
  }
  if (action === 'choose-link-type') {
    if (message === 'Back') {
      const domains = await getPurchasedDomains(chatId);
      const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
      bot.sendMessage(chatId, `Please select the domain you would like to connect with your shortened link.`, {
        reply_markup: {
          keyboard,
        },
      });
      set(state, chatId, 'action', 'shorten');
      return;
    }

    if (!linkOptions.includes(message)) {
      bot.sendMessage(chatId, `?`);
    }

    if (message === 'Custom Link') {
      set(state, chatId, 'action', 'shorten-custom');
      bot.sendMessage(chatId, `Please tell your us preferred short link extension: e.g payer`, bc);
      return;
    }

    const url = (await get(state, chatId))?.url;
    const domain = (await get(state, chatId))?.selectedDomain;
    const shortenedURL = domain + '/' + nanoid();
    if (await get(fullUrlOf, shortenedURL)) {
      bot.sendMessage(chatId, `Link already exists. Please send 'ok' to try another.`);
      return;
    }

    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, o);
    set(fullUrlOf, shortenedURL.replace('.', '@'), url);
    set(linksOf, chatId, shortenedURL.replace('.', '@'), url);
    totalShortLinks++;
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'shorten-custom') {
    if (message === 'Back') {
      bot.sendMessage(chatId, `Choose link type:`, linkType);
      set(state, chatId, 'action', 'choose-link-type');
    }

    const url = (await get(state, chatId))?.url;
    const domain = (await get(state, chatId))?.selectedDomain;
    const shortenedURL = domain + '/' + message;

    if (!isValidUrl('https://' + shortenedURL)) {
      bot.sendMessage(chatId, 'Please provide a valid URL. e.g https://google.com');
      return;
    }

    if (await get(fullUrlOf, shortenedURL)) {
      bot.sendMessage(chatId, `Link already exists. Please try another.`);
      return;
    }

    set(fullUrlOf, shortenedURL.replace('.', '@'), url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, o);

    set(linksOf, chatId, shortenedURL.replace('.', '@'), url);

    totalShortLinks++;

    set(state, chatId, 'action', 'none');
    return;
  }
  //
  //
  if (message === '🌐 Buy domain names') {
    if (!(await isSubscribed(chatId))) {
      bot.sendMessage(chatId, '📋 Subscribe first');
      return;
    }
    set(state, chatId, 'action', 'choose-domain-to-buy');
    bot.sendMessage(chatId, 'Please provide the domain name you would like to purchase.', bc);
    return;
  }
  if (action === 'choose-domain-to-buy') {
    const domain = message.toLowerCase();
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(domain)) {
      bot.sendMessage(chatId, 'Domain name is invalid. Please try another domain name.');
      return;
    }

    const { available, price } = await checkDomainPriceOnline(domain);

    if (!available) {
      bot.sendMessage(chatId, 'Domain is not available. Please try another domain name.', rem);
      return;
    }

    bot.sendMessage(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, pay);

    set(state, chatId, 'chosenDomainPrice', price);
    set(state, chatId, 'action', 'domain-name-payment');
    set(state, chatId, 'chosenDomainForPayment', domain);
    return;
  }
  if (action === 'domain-name-payment') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-domain-to-buy');
      bot.sendMessage(chatId, 'Please provide the domain name you would like to purchase.', bc);
      return;
    }

    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', o);
      return;
    }

    if (paymentOption === 'Crypto') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: [...cryptoTransferOptions.map(d => [d.toUpperCase()]), ['Back', 'Cancel']],
        },
      });
      set(state, chatId, 'action', 'crypto-transfer-payment-domain');
      return;
    }

    bot.sendMessage(chatId, `Please provide your email for bank payment reference:`, bc);
    set(state, chatId, 'action', 'bank-transfer-payment-domain');
    return;
  }
  if (action === 'bank-transfer-payment-domain') {
    const price = (await get(state, chatId))?.chosenDomainPrice;
    const domain = (await get(state, chatId))?.chosenDomainForPayment;
    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'domain-name-payment');
      return;
    }
    const email = message;

    if (!isValidEmail(email)) {
      bot.sendMessage(chatId, 'Please provide a valid email');
      return;
    }

    const priceNGN = Number(await convertUSDToNaira(price));
    const reference = nanoid();
    set(chatIdOfPayment, reference, chatId);
    const { url, error } = await createCheckout(priceNGN, reference, '/bank-payment-for-domain', email, username);

    if (error) {
      bot.sendMessage(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    bot.sendMessage(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    bot.sendMessage(chatId, `Bank ₦aira + Card 🌐︎`, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'crypto-transfer-payment-domain') {
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const priceUSD = (await get(state, chatId))?.chosenDomainPrice;
    const domain = (await get(state, chatId))?.chosenDomainForPayment;
    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${domain} subscription is ${priceUSD} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'domain-name-payment');
      return;
    }
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', o);
      return;
    }

    const ref = nanoid();
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-domain?a=b&ref=${ref}`,
    );

    set(chatIdOfPayment, address, chatId);
    set(state, chatId, 'cryptoPaymentSession', {
      priceCrypto,
      ticker,
      ref,
    });

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    set(state, chatId, 'action', 'none');

    // send QR Code Image
    const qrCode = await bb.getQrcode(null, 256);
    const buffer = Buffer.from(qrCode?.qr_code, 'base64');
    fs.writeFileSync('image.png', buffer);
    bot
      .sendPhoto(chatId, 'image.png', {
        caption: 'Here is your QR code!',
      })
      .then(() => fs.unlinkSync('image.png'))
      .catch(console.error);
    return;
  }
  //
  //
  if (message === '📋 Subscribe here') {
    if (await isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'You are currently enrolled in a subscription plan.', o);
      return;
    }

    set(state, chatId, 'action', 'choose-subscription');
    bot.sendMessage(chatId, 'Select the perfect subscription plan for you:', chooseSubscription);
    return;
  }
  if (action === 'choose-subscription') {
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      bot.sendMessage(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    set(state, chatId, 'chosenPlanForPayment', plan);

    bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, pay);

    set(state, chatId, 'action', 'subscription-payment');
    return;
  }
  if (action === 'subscription-payment') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-subscription');
      bot.sendMessage(chatId, 'Select the perfect subscription plan for you:', chooseSubscription);
      return;
    }
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', o);
      return;
    }

    if (paymentOption === 'Bank ₦aira + Card🌐︎') {
      bot.sendMessage(chatId, `Please provide your email for bank payment reference:`, bc);
      set(state, chatId, 'action', 'bank-transfer-payment-subscription');
      return;
    }

    bot.sendMessage(chatId, `Please choose a crypto currency`, {
      reply_markup: {
        keyboard: [...cryptoTransferOptions.map(d => [d.toUpperCase()]), ['Back', 'Cancel']],
      },
    });
    set(state, chatId, 'action', 'crypto-transfer-payment');
    return;
  }
  if (action === 'bank-transfer-payment-subscription') {
    const plan = (await get(state, chatId))?.chosenPlanForPayment;
    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'subscription-payment');
      return;
    }
    const email = message;

    if (!isValidEmail(email)) {
      bot.sendMessage(chatId, 'Please provide a valid email');
      return;
    }

    const priceNGN = Number(await convertUSDToNaira(priceOf[plan]));
    const reference = nanoid();
    set(chatIdOfPayment, reference, chatId);
    const { url, error } = await createCheckout(priceNGN, reference, '/bank-payment-for-subscription', email, username);

    if (error) {
      bot.sendMessage(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    bot.sendMessage(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    bot.sendMessage(chatId, `Bank ₦aira + Card 🌐︎`, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'crypto-transfer-payment') {
    const plan = (await get(state, chatId))?.chosenPlanForPayment;
    const priceUSD = priceOf[plan];

    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceUSD} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'subscription-payment');
      return;
    }
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies

    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', o);
      return;
    }

    const ref = nanoid();
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-subscription?a=b&ref=${ref}`,
    );
    set(chatIdOfPayment, address, chatId);
    set(state, chatId, 'cryptoPaymentSession', {
      priceCrypto,
      ticker,
      ref,
    });

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    set(state, chatId, 'action', 'none');

    // send QR Code Image
    const qrCode = await bb.getQrcode(null, 256);
    const buffer = Buffer.from(qrCode?.qr_code, 'base64');
    fs.writeFileSync('image.png', buffer);
    bot
      .sendPhoto(chatId, 'image.png', {
        caption: 'Here is your QR code!',
      })
      .then(() => fs.unlinkSync('image.png'))
      .catch(console.error);
    return;
  }
  //
  //
  if (message === '🔍 View subscription plan') {
    const subscribedPlan = await get(planOf, chatId);

    if (subscribedPlan) {
      if (!(await isSubscribed(chatId))) {
        bot.sendMessage(
          chatId,
          `Your ${subscribedPlan} subscription is expired on ${new Date(await get(planEndingTime, chatId))}`,
        );
        return;
      }

      bot.sendMessage(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          await get(planEndingTime, chatId),
        )}`,
      );
      return;
    }

    bot.sendMessage(chatId, 'You are not currently subscribed to any plan.');
    return;
  }
  if (message === '🔍 View shortened links') {
    const links = await getShortLinks(chatId);
    if (links.length === 0) {
      bot.sendMessage(chatId, 'You have no shortened links yet.');
      return;
    }

    const linksText = formatLinks(links);
    bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
    return;
  }
  if (message === '👀 View domain names') {
    const purchasedDomains = await getPurchasedDomains(chatId);
    if (purchasedDomains.length === 0) {
      bot.sendMessage(chatId, 'You have no purchased domains yet.');
      return;
    }

    const domainsText = purchasedDomains.join('\n');
    bot.sendMessage(chatId, `Here are your purchased domains:\n${domainsText}`);
    return;
  }
  if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    backupTheData();
    bot.sendMessage(chatId, 'Backup created successfully.');
    return;
  }
  if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    restoreData();
    bot.sendMessage(chatId, 'Data restored successfully.');
    return;
  }
  if (message === 'View Users') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, `Users:\n${(await getUsers()).join('\n')}`);
    return;
  }
  if (message === 'View Analytics') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    const analyticsData = await getAnalytics();
    bot.sendMessage(chatId, `Analytics Data:\n${analyticsData.join('\n')}`);
    return;
  }
  if (message === '🛠️ Get support') {
    bot.sendMessage(chatId, `Please contact ${SUPPORT_USERNAME}`);
    return;
  }
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

async function getPurchasedDomains(chatId) {
  let ans = await get(domainsOf, chatId);
  if (!ans) return [];

  ans = Object.keys(ans).map(d => d.replace('@', '.')); // de sanitize due to mongo db
  return ans.filter(d => d !== '_id');
}

async function getUsers() {
  let ans = await getAll(chatIdOf);
  if (!ans) return [];

  return ans.map(a => a._id);
}

async function getAnalytics() {
  let ans = await getAll(clicksOf);
  if (!ans) return [];
  return ans.map(a => `${a._id}  ${a.val} click${a.val === 1 ? '' : 's'}`);
}

async function getShortLinks(chatId) {
  let ans = await get(linksOf, chatId);
  if (!ans) return [];

  ans = Object.keys(ans).map(d => ({ shorter: d, url: ans[d] }));
  ans = ans.filter(d => d.shorter !== '_id');

  let ret = [];
  for (let i = 0; i < ans.length; i++) {
    const link = ans[i];
    let clicks = (await get(clicksOn, link.shorter)) || 0;

    ret.push({ clicks, shorter: link.shorter.replace('@', '.'), url: link.url });
  }

  return ret;
}

async function ownsDomainName(chatId) {
  return (await getPurchasedDomains(chatId)).length > 0;
}

async function isSubscribed(chatId) {
  const time = await get(planEndingTime, chatId);
  return time && time > Date.now();
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8');
    const restoredData = JSON.parse(backupJSON);
    Object.assign(state, restoredData.state);
    Object.assign(linksOf, restoredData.linksOf);
    Object.assign(clicksOf, restoredData.clicksOf);
    Object.assign(clicksOn, restoredData.clicksOn);
    Object.assign(fullUrlOf, restoredData.fullUrlOf);
    Object.assign(domainsOf, restoredData.domainsOf);
    Object.assign(nameOf, restoredData.nameOfChatId);
    Object.assign(chatIdOf, restoredData.chatIdOfName);
    Object.assign(chatIdBlocked, restoredData.chatIdBlocked);
    Object.assign(planEndingTime, restoredData.planEndingTime);
    Object.assign(chatIdOfPayment, restoredData.chatIdOfPayment);
    Object.assign(totalShortLinks, restoredData.totalShortLinks);
    console.log('Data restored.');
  } catch (error) {
    console.error('Error restoring data:', error.message);
  }
}

async function backupTheData() {
  const backupData = {
    state,
    linksOf,
    clicksOf,
    clicksOn,
    fullUrlOf,
    domainsOf,
    nameOf,
    chatIdOf,
    chatIdBlocked,
    planEndingTime,
    chatIdOfPayment,
    totalShortLinks,
  };
  const backupJSON = JSON.stringify(backupData, null, 2);
  fs.writeFileSync('backup.json', backupJSON, 'utf-8');
}

async function buyDomain(chatId, domain) {
  // Reference https://www.mongodb.com/docs/manual/core/dot-dollar-considerations
  const domainSanitizedForDb = domain.replace('.', '@');

  // set(domainsOf, chatId, domainSanitizedForDb, true);
  // return { success: true };

  const result = await buyDomainOnline(domain);
  if (result.success) {
    set(domainsOf, chatId, domainSanitizedForDb, true);
  }

  return result;
}

const formatLinks = links => {
  return links.map(d => `${d.clicks} ${d.clicks ? 'click' : 'clicks'} → ${d.shorter} → ${d.url}\n`);
};

const app = express();
app.use(cors());
app.set('json spaces', 2);
app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});
app.get('/bank-payment-for-subscription', async (req, res) => {
  const reference = req.query.reference;
  const chatId = await get(chatIdOfPayment, reference);

  const plan = (await get(state, chatId))?.chosenPlanForPayment;
  if (!plan) {
    res.send('Payment already processed or not found');
    return;
  }

  set(planOf, chatId, plan);
  set(planEndingTime, chatId, Date.now() + timeOf[plan]);
  set(
    payments,
    reference,
    `Bank, Plan, ${plan}, ${chatId}, $${priceOf[plan]}, ${await get(nameOf, chatId)}, ${new Date()}`,
  );
  del(state, chatId);
  del(chatIdOfPayment, reference);

  bot.sendMessage(
    chatId,
    `Your payment was successful, and you're now subscribed to our ${plan} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  const html = `
        <html>
            <body>
                <h1>Payment Processed Successfully!</h1>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
        </html>
    `;
  res.send(html);
  // res.send('Payment processed successfully, You can now close this window');
});
app.get('/bank-payment-for-domain', async (req, res) => {
  const reference = req.query.reference;
  const chatId = await get(chatIdOfPayment, reference);
  const domain = (await get(state, chatId))?.chosenDomainForPayment;

  if (!domain) {
    res.send('Payment already processed or not found');
    return;
  }
  // take out this common code IsA
  const { error: buyDomainError } = await buyDomain(chatId, domain);
  if (buyDomainError) {
    bot.sendMessage(chatId, 'Domain purchase fails, try another name.', o);
    return;
  }
  bot.sendMessage(
    chatId,
    `Your payment is processed and domain ${domain} is now yours. Enjoy URL shortening with your new domain. Thanks for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
  if (error) {
    bot.sendMessage(chatId, `Error saving domain in server`, o);
    return;
  }

  bot.sendMessage(chatId, `Linking domain with your account...`); // save railway in domain
  const { error: saveServerInDomainError } = await saveServerInDomain(domain, server);

  if (saveServerInDomainError) {
    bot.sendMessage(chatId, `Error saving server in domain ${saveServerInDomainError}`, o);
    return;
  }

  bot.sendMessage(
    chatId,
    `Your domain ${domain} is now linked to your account. Please note that DNS update might take up to 1hr. Enjoy URL shortening. 😇`,
  );

  const chosenDomainPrice = (await get(state, chatId))?.chosenDomainPrice;
  del(state, chatId);
  del(chatIdOfPayment, reference);
  set(
    payments,
    reference,
    `Bank, Domain, ${domain}, $${chosenDomainPrice}, ${chatId}, ${await get(nameOf, chatId)}, ${new Date()}`,
  );

  res.send('Payment processed successfully, You can now close this window');
});
app.get('/crypto-payment-for-subscription', async (req, res) => {
  // handle multiple invocations of the same url
  const urlParams = new URLSearchParams(req.originalUrl);

  const address_in = urlParams.get('address_in');
  const coin = urlParams.get('coin');
  const refReceived = urlParams.get('ref');
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.send('Invalid payment data');
    return;
  }

  const chatId = await get(chatIdOfPayment, address_in);
  const session = (await get(state, chatId))?.cryptoPaymentSession;

  if (!session) {
    res.send('Payment issue, no crypto payment session found');
    console.log('No crypto payment session found ' + req.originalUrl);
    return;
  }

  const { priceCrypto, ticker, ref } = session;
  const price = Number(priceCrypto) + Number(priceCrypto) * 0.06;
  console.log({ value_coin, priceCrypto, price });
  if (!(value_coin >= price && coin === ticker && ref === refReceived)) {
    console.log(req.originalUrl);
    res.send('Wrong coin or wrong price');
    return;
  }

  const plan = (await get(state, chatId))?.chosenPlanForPayment;
  set(planEndingTime, chatId, Date.now() + timeOf[plan]);
  set(planOf, chatId, plan);
  bot.sendMessage(
    chatId,
    `Your payment was successful, and you're now subscribed to our ${plan} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  set(
    payments,
    address_in,
    `Crypto, Plan, ${plan}, ${chatId}, $${priceOf[plan]}, ${value_coin} ${coin}, ${await get(
      nameOf,
      chatId,
    )}, ${new Date()}`,
  );

  del(state, chatId);
  del(chatIdOfPayment, address_in);
  res.send('Payment processed successfully, You can now close this window');
});

app.get('/crypto-payment-for-domain', async (req, res) => {
  const urlParams = new URLSearchParams(req.originalUrl);
  const coin = urlParams.get('coin');
  const address_in = urlParams.get('address_in');
  const refReceived = urlParams.get('ref');
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.send('Invalid payment data');
    return;
  }

  const chatId = await get(chatIdOfPayment, address_in);
  const session = (await get(state, chatId))?.cryptoPaymentSession;

  if (!session) {
    res.send('Payment session not found, please try again or contact support');
    return;
  }

  const { priceCrypto, ticker, ref } = session;
  const price = Number(priceCrypto) + Number(priceCrypto) * 0.06;
  if (!(value_coin >= price && coin === ticker && ref === refReceived)) {
    console.log(`payment session error for crypto ${req.originalUrl}`);
    res.send('Payment invalid, either less value sent or coin sent is not correct');
    return;
  }

  const domain = (await get(state, chatId))?.chosenDomainForPayment;
  if (!domain) {
    res.send('Payment already processed or not found');
    return;
  }

  const { error: buyDomainError } = await buyDomain(chatId, domain);
  if (buyDomainError) {
    bot.sendMessage(chatId, 'Domain purchase fails, try another name.', o);
    return;
  }
  bot.sendMessage(
    chatId,
    `Your payment is processed and domain ${domain} is now yours. Enjoy URL shortening with your new domain. Thanks for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
  if (error) {
    bot.sendMessage(chatId, `Error saving domain in server, contact support`, o);
    return;
  }

  bot.sendMessage(chatId, `Linking domain with your account...`); // save railway in domain
  const { error: saveServerInDomainError } = await saveServerInDomain(domain, server);

  if (saveServerInDomainError) {
    bot.sendMessage(chatId, `Error saving server in domain ${saveServerInDomainError}`, o);
    return;
  }

  bot.sendMessage(
    chatId,
    `Your domain ${domain} is now linked to your account. Please note that DNS update might take up to 1hr. Enjoy URL shortening. 😇`,
  );

  const chosenDomainPrice = (await get(state, chatId))?.chosenDomainPrice;
  set(
    payments,
    reference,
    `Crypto, Domain Paid, ${domain}, $${chosenDomainPrice}, ${value_coin} ${coin}, ${chatId}, ${await get(
      nameOf,
      chatId,
    )}, ${new Date()}`,
  );

  del(state, chatId);
  del(chatIdOfPayment, address_in);
  res.send('Payment processed successfully, You can now close this window');
});
app.get('/json', async (req, res) => {
  await backupTheData();
  const fileName = 'backup.json';
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(fileName).pipe(res);
});

let serverStartTime = new Date();
app.get('/uptime', (req, res) => {
  let now = new Date();
  let uptimeInMilliseconds = now - serverStartTime;
  let uptimeInHours = uptimeInMilliseconds / (1000 * 60 * 60);

  res.send(`Server has been running for ${uptimeInHours.toFixed(2)} hours.`);
});

app.get('/:id', async (req, res) => {
  const { id } = req?.params;
  if (id === '') {
    res.json({ message: 'Salam', from: req.hostname });
    return;
  }
  const shortUrl = `${req.hostname}/${id}`;
  const url = await get(fullUrlOf, shortUrl);

  if (!url) {
    res.status(404).send('Link not found');
    return;
  }

  res.redirect(url);

  increment(clicksOf, 'total');
  increment(clicksOf, today());
  increment(clicksOf, week());
  increment(clicksOf, month());
  increment(clicksOf, year());

  const sanitizeShort = shortUrl.replace('.', '@');
  increment(clicksOn, sanitizeShort);
});
const startServer = () => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
};
startServer();

const tryConnectReseller = () => {
  getRegisteredDomainNames()
    .then(() => {
      connect_reseller_working = true;
    })
    .catch(() => {
      //
      axios.get('https://api.ipify.org/').then(ip => {
        const message = `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`;
        console.log(message);
        bot.sendMessage(process.env.TELEGRAM_DEV_CHAT_ID, message, { parse_mode: 'markdown' });
        bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'markdown' });
      });
      //
    });
};

tryConnectReseller();
