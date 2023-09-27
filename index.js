// TODO: keep in eye data types Number vs String may give bugs...

const { getRegisteredDomainNames } = require('./get-purchased-domains.test.js');
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
} = require('./config.js');
const {
  isValidUrl,
  isDeveloper,
  isAdmin,
  checkDomainAvailability,
  convertUSDToNaira,
  getLocalIpAddress,
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
const {
  updateLinksOf,
  getShortenedLinks,
  getAnalyticsData,
  increment,
  get,
  getAll,
  set,
  add,
  del,
} = require('./db.js');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);
process.env['NTBA_FIX_350'] = 1;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SELF_URL = process.env.SELF_URL;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log('Bot is running...');

// variables to implement core functionality
const state = {};
const linksOf = {};
const fullUrlOf = {};
const domainsOf = {};
const domainSold = {};
const chatIdBlocked = {};
const planEndingTime = {};
const chatIdOfPayment = {};
let totalShortLinks = 0;

// variables to view system information
const payments = {};
const users = [];
const clicksOf = {};
const clicksOn = {};
const nameOf = {};
const chatIdOf = {};

let connect_reseller_working = false;
restoreData();

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  const username = get(nameOf, chatId) || msg.from.username || nanoid();
  console.log(chatId + '\t' + username + '\t' + message);

  if (!connect_reseller_working) {
    try {
      await getRegisteredDomainNames();
      connect_reseller_working = true;
    } catch (error) {
      const ip = await axios.get('https://api.ipify.org/');
      // when all okay project okay then put admin other wise admin may irritate of many messages
      const message = `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`;
      console.log(message);
      bot.sendMessage(process.env.TELEGRAM_DEV_CHAT_ID, message, { parse_mode: 'markdown' });
      return;
    }
  }

  if (get(chatIdBlocked, chatId)) {
    bot.sendMessage(chatId, 'You are currently blocked from using the bot. Please contact @nomadly_private', rem);
    return;
  }

  if (!get(state, chatId)) {
    set(state, chatId, {});
  }
  if (!get(nameOf, chatId)) {
    set(nameOf, chatId, username);
    set(chatIdOf, username, chatId);
    add(users, username);
  }

  const action = get(state, chatId, 'action');

  if (message === '/start') {
    if (isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Hello, Admin! Please select an option:', aO);
    } else if (isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Welcome, Developer! Choose an option:', dO);
    } else {
      bot.sendMessage(chatId, 'Thank you for choosing the URL Shortener Bot! Please choose an option:', o);
    }
  }
  //
  else if (message === 'Block User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, 'Please share the username of the user that needs to be blocked.', bc);

    set(state, chatId, 'action', 'block-user');
  } else if (action === 'block-user') {
    if (message === 'Back' || message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, o);
      return;
    }
    const userToBlock = message;

    const chatIdToBlock = get(chatIdOf, userToBlock);

    if (!chatIdToBlock) {
      bot.sendMessage(chatId, `User ${userToBlock} not found`, bc);
      return;
    }

    set(chatIdBlocked, chatIdToBlock, true);
    bot.sendMessage(chatId, `User ${userToBlock} has been blocked.`, aO);
    del(state, chatId, 'action');
  }
  //
  else if (message === 'Unblock User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, 'Please share the username of the user that needs to be unblocked.', bc);
    set(state, chatId, 'action', 'unblock-user');
  } else if (action === 'unblock-user') {
    if (message === 'Back' || message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, o);
      return;
    }

    const userToUnblock = message;
    const chatIdToUnblock = get(chatIdOf, userToUnblock);
    if (!chatIdToUnblock) {
      bot.sendMessage(chatId, `User ${userToUnblock} not found`, bc);
      return;
    }

    set(chatIdBlocked, chatIdToUnblock, false);
    bot.sendMessage(chatId, `User ${userToUnblock} has been unblocked.`, aO);
    del(state, chatId, 'action');
  }
  //
  else if (message === '🔗 URL Shortener') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, '📋 Subscribe first');
      return;
    }
    if (!ownsDomainName(chatId)) {
      bot.sendMessage(chatId, '🌐 Buy domain names first');
      return;
    }
    set(state, chatId, 'action', 'choose-domain');
    bot.sendMessage(chatId, 'Kindly share the URL that you would like to have shortened.', bc);
  } else if (action === 'choose-domain') {
    if (message === 'Back' || message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, o);
      return;
    }
    if (!isValidUrl(message)) {
      bot.sendMessage(chatId, 'Please provide a valid URL. e.g https://google.com', bc);
      return;
    }

    const domains = getPurchasedDomains(chatId);
    const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
    bot.sendMessage(chatId, `Please select the domain you would like to connect with your shortened link.`, {
      reply_markup: {
        keyboard,
      },
    });
    set(state, chatId, 'action', 'shorten');
    set(state, chatId, 'url', message);
  } else if (action === 'shorten') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-domain');
      bot.sendMessage(chatId, `Please choose the URL to shorten.`, bc);
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
      return;
    }
    const domains = getPurchasedDomains(chatId);
    if (!domains.includes(message)) {
      bot.sendMessage(chatId, 'Please choose a valid domain', bc);
      return;
    }
    set(state, chatId, 'selectedDomain', message);

    bot.sendMessage(chatId, `Choose link type:`, linkType);
    set(state, chatId, 'action', 'choose-link-type');
  } else if (action === 'choose-link-type') {
    if (message === 'Back') {
      const domains = getPurchasedDomains(chatId);
      const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
      bot.sendMessage(chatId, `Please select the domain you would like to connect with your shortened link.`, {
        reply_markup: {
          keyboard,
        },
      });
      set(state, chatId, 'action', 'shorten');
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
    } else if (message === 'Random Link') {
      const url = get(state, chatId, 'url');
      const domain = get(state, chatId, 'selectedDomain');
      const shortenedURL = domain + '/' + nanoid();
      if (get(fullUrlOf, shortenedURL)) {
        bot.sendMessage(chatId, `Link already exists. Please send 'ok' to try another.`);
        return;
      }
      set(fullUrlOf, shortenedURL, url);
      bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, o);

      await updateLinksOf(linksOf, chatId, { url, shortenedURL });

      totalShortLinks++;
      del(state, chatId, 'url');
      del(state, chatId, 'action');
      del(state, chatId, 'selectedDomain');
    } else if (message === 'Custom Link') {
      set(state, chatId, 'action', 'shorten-custom');
      bot.sendMessage(chatId, `Please tell your us preferred short link extension: e.g payer`, bc);
      return;
    } else {
      bot.sendMessage(chatId, `?`);
    }
  } else if (action === 'shorten-custom') {
    if (message === 'Back') {
      bot.sendMessage(chatId, `Choose link type:`, linkType);
      set(state, chatId, 'action', 'choose-link-type');
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
      return;
    }

    const url = get(state, chatId, 'url');
    const domain = get(state, chatId, 'selectedDomain');
    const shortenedURL = domain + '/' + message;

    if (!isValidUrl('https://' + shortenedURL)) {
      bot.sendMessage(chatId, 'Please provide a valid URL. e.g https://google.com');
      return;
    }

    if (get(fullUrlOf, shortenedURL)) {
      bot.sendMessage(chatId, `Link already exists. Please try another.`);
      return;
    }

    set(fullUrlOf, shortenedURL, url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, o);

    await updateLinksOf(linksOf, chatId, { url, shortenedURL });

    totalShortLinks++;
    del(state, chatId, 'url');
    del(state, chatId, 'action');
    del(state, chatId, 'selectedDomain');
  }
  //
  else if (message === '🌐 Buy domain names') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, '📋 Subscribe first');
      return;
    }
    set(state, chatId, 'action', 'choose-domain-to-buy');
    bot.sendMessage(chatId, 'Please provide the domain name you would like to purchase.', bc);
  } else if (action === 'choose-domain-to-buy') {
    if (message === 'Back' || message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, o);
      return;
    }

    const domain = message.toLowerCase();
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(domain)) {
      bot.sendMessage(chatId, 'Domain name is invalid. Please try another domain name.');
      return;
    }

    const { available, price } = await checkDomainAvailability(domain, domainSold);

    if (!available) {
      bot.sendMessage(chatId, 'Domain is not available. Please try another domain name.', rem);
      return;
    }

    bot.sendMessage(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, pay);

    set(state, chatId, 'chosenDomainPrice', price);
    set(state, chatId, 'action', 'domain-name-payment');
    set(state, chatId, 'chosenDomainForPayment', domain);
  } else if (action === 'domain-name-payment') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-domain-to-buy');
      bot.sendMessage(chatId, 'Please provide the domain name you would like to purchase.', bc);
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
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
  } else if (action === 'bank-transfer-payment-domain') {
    const price = get(state, chatId, 'chosenDomainPrice');
    const domain = get(state, chatId, 'chosenDomainForPayment');
    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, pay);

      set(state, chatId, 'action', 'domain-name-payment');
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
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
      del(state, chatId, 'action');
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
    del(state, chatId, 'action');
  } else if (action === 'crypto-transfer-payment-domain') {
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const priceUSD = get(state, chatId, 'chosenDomainPrice');
    const domain = get(state, chatId, 'chosenDomainForPayment');
    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${domain} subscription is ${priceUSD} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'domain-name-payment');
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
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

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to\n\n<code>${address}</code>\n\nOnce the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    del(state, chatId, 'action');

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
  }
  //
  else if (message === '📋 Subscribe here') {
    if (isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'You are currently enrolled in a subscription plan.', o);
      return;
    }

    set(state, chatId, 'action', 'choose-subscription');
    bot.sendMessage(chatId, 'Select the perfect subscription plan for you:', chooseSubscription);
  } else if (action === 'choose-subscription') {
    if (message === 'Back' || message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, o);
      return;
    }
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      bot.sendMessage(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    set(state, chatId, 'chosenPlanForPayment', plan);

    bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, pay);

    set(state, chatId, 'action', 'subscription-payment');
  } else if (action === 'subscription-payment') {
    if (message === 'Back') {
      set(state, chatId, 'action', 'choose-subscription');
      bot.sendMessage(chatId, 'Select the perfect subscription plan for you:', chooseSubscription);
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
      return;
    }

    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', o);
      return;
    }

    // call payment apis and send instructions to user and save
    // the payment to make in db so we can verify the payment when its received
    if (paymentOption === 'Crypto') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: [...cryptoTransferOptions.map(d => [d.toUpperCase()]), ['Back', 'Cancel']],
        },
      });
      set(state, chatId, 'action', 'crypto-transfer-payment');
    } else {
      bot.sendMessage(chatId, `Please provide your email for bank payment reference:`, bc);
      set(state, chatId, 'action', 'bank-transfer-payment');
    }
  } else if (action === 'bank-transfer-payment') {
    if (message === 'Back') {
      const plan = get(state, chatId, 'chosenPlanForPayment');
      bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, pay);

      set(state, chatId, 'action', 'subscription-payment');
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
      return;
    }
    const email = message;

    if (!isValidEmail(email)) {
      bot.sendMessage(chatId, 'Please provide a valid email');
      return;
    }

    const plan = get(state, chatId, 'chosenPlanForPayment');
    const priceNGN = Number(await convertUSDToNaira(priceOf[plan]));
    const reference = nanoid();
    set(chatIdOfPayment, reference, chatId);
    const { url, error } = await createCheckout(priceNGN, reference, '/bank-payment-for-subscription', email, username);

    if (error) {
      bot.sendMessage(chatId, error, o);
      del(state, chatId, 'action');
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
    del(state, chatId, 'action');
  } else if (action === 'crypto-transfer-payment') {
    const plan = get(state, chatId, 'chosenPlanForPayment');
    const priceUSD = priceOf[plan];

    if (message === 'Back') {
      bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceUSD} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'subscription-payment');
      return;
    } else if (message === 'Cancel') {
      del(state, chatId, 'action');
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, o);
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

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to \n\n<code>${address}</code>\n\nOnce the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    del(state, chatId, 'action');

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
  }
  //
  else if (message === '🔍 View subscription plan') {
    const subscribedPlan = get(state, chatId, 'subscription');

    if (subscribedPlan) {
      if (!isSubscribed(chatId)) {
        bot.sendMessage(
          chatId,
          `Your ${subscribedPlan} subscription is expired on ${new Date(get(planEndingTime, chatId))}`,
        );
        return;
      }

      bot.sendMessage(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          get(planEndingTime, chatId),
        )}`,
      );
      return;
    }

    bot.sendMessage(chatId, 'You are not currently subscribed to any plan.');
  } else if (message === '🔍 View shortened links') {
    const shortenedLinks = await getShortenedLinks(linksOf, chatId, clicksOn);
    if (shortenedLinks.length > 0) {
      const linksText = shortenedLinks.join('\n');
      bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
    } else {
      bot.sendMessage(chatId, 'You have no shortened links yet.');
    }
  } else if (message === '👀 View domain names') {
    const purchasedDomains = getPurchasedDomains(chatId);
    if (purchasedDomains.length > 0) {
      const domainsText = purchasedDomains.join('\n');
      bot.sendMessage(chatId, `Here are your purchased domains:\n${domainsText}`);
    } else {
      bot.sendMessage(chatId, 'You have no purchased domains yet.');
    }
  } else if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    backupTheData();
    bot.sendMessage(chatId, 'Backup created successfully.');
  } else if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    restoreData();
    bot.sendMessage(chatId, 'Data restored successfully.');
  } else if (message === 'View Users') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, `Users:\n${getAll(users).join('\n')}`);
  } else if (message === 'View Analytics') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    const analyticsData = getAnalyticsData(clicksOf);
    bot.sendMessage(chatId, `Analytics Data:\n${analyticsData}`);
  } else if (message === '🛠️ Get support') {
    bot.sendMessage(chatId, 'Please contact @nomadly_private');
  }
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

function getPurchasedDomains(chatId) {
  return get(domainsOf, chatId) || [];
}

function ownsDomainName(chatId) {
  return getPurchasedDomains(chatId).length > 0;
}

function isSubscribed(chatId) {
  const time = get(planEndingTime, chatId);
  return time && time > Date.now();
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8');
    const restoredData = JSON.parse(backupJSON);
    Object.assign(users, restoredData.users);
    Object.assign(state, restoredData.state);
    Object.assign(linksOf, restoredData.linksOf);
    Object.assign(clicksOf, restoredData.clicksOf);
    Object.assign(clicksOn, restoredData.clicksOn);
    Object.assign(fullUrlOf, restoredData.fullUrlOf);
    Object.assign(domainsOf, restoredData.domainsOf);
    Object.assign(domainSold, restoredData.domainSold);
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
    users,
    linksOf,
    clicksOf,
    clicksOn,
    fullUrlOf,
    domainsOf,
    domainSold,
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
  // check dns records
  if (get(domainSold, domain)) {
    return { error: 'Already registered' };
  }
  // return { success: true };

  const result = await buyDomainOnline(domain);

  if (result.success) {
    set(domainSold, domain, true);
    const domains = (get(domainsOf, chatId) || []).concat(domain);
    set(domainsOf, chatId, domains);
  }

  return result;
}

const app = express();
app.use(cors());
app.set('json spaces', 2);
app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});
app.get('/bank-payment-for-subscription', (req, res) => {
  console.log(req.originalUrl);
  const reference = req.query.reference;
  const chatId = get(chatIdOfPayment, reference);

  if (!get(state, chatId, 'chosenPlanForPayment')) {
    res.send('Payment already processed or not found');
    return;
  }

  const plan = get(state, chatId, 'chosenPlanForPayment');
  set(planEndingTime, chatId, Date.now() + timeOf[plan]);

  set(state, chatId, 'subscription', plan);

  del(chatIdOfPayment, reference);
  set(
    payments,
    reference,
    `Bank, Plan, ${plan}, ${chatId}, $${priceOf[plan]}, ${get(nameOf, chatId)}, ${new Date()}, ${get(
      planEndingTime,
      chatId,
    )}`,
  );
  del(state, chatId, 'chosenPlanForPayment');

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
  console.log(req.originalUrl);
  const reference = req.query.reference;
  const chatId = get(chatIdOfPayment, reference);
  if (!get(state, chatId, 'chosenDomainForPayment')) {
    res.send('Payment already processed or not found');
    return;
  }

  const domain = get(state, chatId, 'chosenDomainForPayment');
  const { error: buyDomainError } = await buyDomain(chatId, domain);
  if (buyDomainError) {
    bot.sendMessage(chatId, 'Domain purchase fails, try another name.', rem);
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

  const chosenDomainPrice = get(state, chatId, 'chosenDomainPrice');
  set(chatIdOfPayment, reference, '');
  set(
    payments,
    reference,
    `Bank, Domain, ${domain}, $${chosenDomainPrice}, ${chatId}, ${get(nameOf, chatId)}, ${new Date()}`,
  );

  del(state, chatId, 'chosenDomainPrice');
  del(state, chatId, 'chosenDomainForPayment');

  res.send('Payment processed successfully, You can now close this window');
});
app.get('/crypto-payment-for-subscription', (req, res) => {
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

  const chatId = get(chatIdOfPayment, address_in);
  const session = get(state, chatId, 'cryptoPaymentSession');

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

  const plan = get(state, chatId, 'chosenPlanForPayment');
  set(planEndingTime, chatId, Date.now(), timeOf[plan]);
  set(state, chatId, 'subscription', plan);
  bot.sendMessage(
    chatId,
    `Your payment was successful, and you're now subscribed to our ${plan} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  set(chatIdOfPayment, address_in, '');
  set(
    payments,
    address_in,
    `Crypto, Plan, ${plan}, ${chatId}, $${priceOf[plan]}, ${value_coin} ${coin}, ${get(
      nameOf,
      chatId,
    )}, ${new Date()}, ${get(planEndingTime, chatId)}`,
  );

  del(state, chatId, 'chosenPlanForPayment');
  del(state, chatId, 'cryptoPaymentSession');
  res.send('Payment processed successfully, You can now close this window');
});

app.get('/crypto-payment-for-domain', async (req, res) => {
  console.log(req.originalUrl);

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

  const chatId = get(chatIdOfPayment, address_in);
  const session = get(state, chatId, 'cryptoPaymentSession');

  if (!session) {
    res.send('Payment session not found, please try again or contact support');
    return;
  }

  const { priceCrypto, ticker, ref } = session;
  const price = Number(priceCrypto) + Number(priceCrypto) * 0.06;
  console.log({ value_coin, priceCrypto, price });
  if (!(value_coin >= price && coin === ticker && ref === refReceived)) {
    console.log(`payment session error for crypto ${req.originalUrl}`);
    res.send('Payment invalid, either less value sent or coin sent is not correct');
    return;
  }

  if (!get(state, chatId, 'chosenDomainForPayment')) {
    res.send('Payment already processed or not found');
    return;
  }

  const domain = get(state, chatId, 'chosenDomainForPayment');
  const { error: buyDomainError } = await buyDomain(chatId, domain);
  if (!buyDomainError) {
    bot.sendMessage(chatId, 'Domain purchase fails, try another name.', rem);
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

  const chosenDomainPrice = get(state, chatId, 'chosenDomainPrice');
  set(chatIdOfPayment, reference, '');
  set(
    payments,
    reference,
    `Crypto, Domain Paid, ${domain}, $${chosenDomainPrice}, ${value_coin} ${coin}, ${chatId}, ${get(
      nameOf,
      chatId,
    )}, ${new Date()}`,
  );

  del(state, chatId, 'chosenDomainPrice');
  del(state, chatId, 'cryptoPaymentSession');
  del(state, chatId, 'chosenDomainForPayment');

  res.send('Payment processed successfully, You can now close this window');
});
app.get('/json', async (req, res) => {
  await backupTheData();
  const fileName = 'backup.json';
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(fileName).pipe(res);
});
app.get('/ip', (req, res) => {
  const localIpAddress = getLocalIpAddress();

  if (localIpAddress) {
    res.send(`Your local IPv4 address is: ${localIpAddress}`);
  } else {
    res.status(500).send('Unable to retrieve local IPv4 address.');
  }
});
app.get('/:id', (req, res) => {
  const { id } = req.params;
  if (id === '') {
    res.json({ message: 'Salam', from: req.hostname });
    return;
  }
  const shortUrl = `${req.hostname}/${id}`;
  const url = get(fullUrlOf, shortUrl);
  if (url) {
    increment(clicksOf, 'total');
    increment(clicksOf, today());
    increment(clicksOf, week());
    increment(clicksOf, month());
    increment(clicksOf, year());
    increment(clicksOn, shortUrl);

    res.redirect(url);
  } else {
    res.status(404).send('Link not found');
  }
});
const startServer = () => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
};
startServer();

getRegisteredDomainNames()
  .then(() => {
    connect_reseller_working = true;
  })
  .catch(() => {
    //
    axios.get('https://api.ipify.org/').then(ip => {
      const message = `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`;
      console.log(message);
      bot.sendMessage(process.env.TELEGRAM_DEV_CHAT_ID, message, {
        parse_mode: 'markdown',
      });
    });
    //
  });
