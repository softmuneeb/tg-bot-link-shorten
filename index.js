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
  adminOptions,
  devOptions,
  options,
  paymentOptions,
  subscriptionOptions,
  cryptoTransferOptions,
  timeOf,
  chooseSubscription,
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
  getShortenedLinks,
  shortenURLAndSave,
} = require('./utils.js');
const {
  getCryptoDepositAddress,
  convertUSDToCrypto,
} = require('./blockbee.js');
const { saveDomainInServer } = require('./cr-rl-connect-domain-to-server.js');
const { saveServerInDomain } = require('./cr-add-dns-record.js');
const { buyDomainOnline } = require('./register-domain.test.js');

const nanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  5,
);
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
const users = [];
const clicksOf = {};
const clicksOn = {};
const nameOfChatId = {};
const chatIdOfName = {};

let connect_reseller_working = false;
restoreData();

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  const username = msg.from.username || nanoid();
  console.log(chatId + '\t' + username + '\t' + message);

  if (!connect_reseller_working) {
    try {
      await getRegisteredDomainNames();
      connect_reseller_working = true;
    } catch (error) {
      const ip = await axios.get('https://api.ipify.org/');
      bot.sendMessage(
        process.env.TELEGRAM_DEV_CHAT_ID, // when all okay project okay then put admin other wise admin may irritate of many messages
        `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`,
        { parse_mode: 'markdown' },
      );
      return;
    }
  }

  if (chatIdBlocked[chatId]) {
    bot.sendMessage(
      chatId,
      'You are currently blocked from using the bot. Please contact @sport_chocolate',
      {
        reply_markup: {
          remove_keyboard: true,
        },
      },
    );
    return;
  }

  if (!state[chatId]) {
    state[chatId] = {};
  }
  if (!nameOfChatId[chatId]) {
    nameOfChatId[chatId] = username;
    chatIdOfName[username] = chatId;
    users.push(username);
  }

  const action = state[chatId]?.action;

  if (message === '/start') {
    if (isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Hello, Admin! Please select an option:',
        adminOptions,
      );
    } else if (isDeveloper(chatId)) {
      bot.sendMessage(
        chatId,
        'Welcome, Developer! Choose an option:',
        devOptions,
      );
    } else {
      bot.sendMessage(
        chatId,
        'Thank you for choosing the URL Shortener Bot! Please choose an option:',
        options,
      );
    }
  }
  //
  else if (message === 'Block User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }

    bot.sendMessage(
      chatId,
      'Please share the username of the user that needs to be blocked.',
      {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      },
    );
    state[chatId].action = 'block-user';
  } else if (action === 'block-user') {
    if (message === 'Back') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Back Button.`, adminOptions);
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, adminOptions);
      return;
    }
    const userToBlock = message;

    const chatIdToBlock = chatIdOfName[userToBlock];

    if (!chatIdToBlock) {
      bot.sendMessage(chatId, `User ${userToBlock} not found`, {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    }

    chatIdBlocked[chatIdToBlock] = true;
    bot.sendMessage(
      chatId,
      `User ${userToBlock} has been blocked.`,
      adminOptions,
    );
    delete state[chatId]?.action;
  }
  //
  else if (message === 'Unblock User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }

    bot.sendMessage(
      chatId,
      'Please share the username of the user that needs to be unblocked.',
      {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      },
    );
    state[chatId].action = 'unblock-user';
  } else if (action === 'unblock-user') {
    if (message === 'Back') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Back Button.`, adminOptions);
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, adminOptions);
      return;
    }
    const userToUnblock = message;
    const chatIdToUnblock = chatIdOfName[userToUnblock];

    if (!chatIdToUnblock) {
      bot.sendMessage(chatId, `User ${userToUnblock} not found`, {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    }
    chatIdBlocked[chatIdToUnblock] = false;
    bot.sendMessage(
      chatId,
      `User ${userToUnblock} has been unblocked.`,
      adminOptions,
    );
    delete state[chatId]?.action;
  }
  //
  else if (message === '🔗 Shorten a URL') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, '📋 Subscribe to plans first');
      return;
    }
    if (!ownsDomainName(chatId)) {
      bot.sendMessage(chatId, '🌐 Buy a domain name first');
      return;
    }
    state[chatId].action = 'choose-domain';
    bot.sendMessage(
      chatId,
      'Kindly share the URL that you would like to have shortened.',
      {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      },
    );
  } else if (action === 'choose-domain') {
    if (message === 'Back') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Back Button.`, options);
      return;
    }
    if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    if (!isValidUrl(message)) {
      bot.sendMessage(
        chatId,
        'Please provide a valid URL. e.g https://google.com',
        {
          reply_markup: {
            keyboard: [['Back', 'Cancel']],
          },
        },
      );
      return;
    }

    const domains = getPurchasedDomains(chatId);
    const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
    bot.sendMessage(
      chatId,
      `Please select the domain you would like to connect with your shortened link.`,
      {
        reply_markup: {
          keyboard,
        },
      },
    );
    state[chatId].action = 'shorten';
    state[chatId].url = message;
  } else if (action === 'shorten') {
    if (message === 'Back') {
      state[chatId].action = 'choose-domain';
      bot.sendMessage(chatId, `Please choose the URL to shorten.`, {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    const domains = getPurchasedDomains(chatId);
    if (!domains.includes(message)) {
      bot.sendMessage(chatId, 'Please choose a valid domain', {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    }
    state[chatId].selectedDomain = message;

    bot.sendMessage(chatId, `Choose link type:`, {
      reply_markup: {
        keyboard: [
          ['Random Link', 'Custom Link'],
          ['Back', 'Cancel'],
        ],
      },
    });
    state[chatId].action = 'choose-link-type';
  }

  //
  else if (action === 'choose-link-type') {
    if (message === 'Back') {
      const domains = getPurchasedDomains(chatId);
      const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
      bot.sendMessage(
        chatId,
        `Please select the domain you would like to connect with your shortened link.`,
        {
          reply_markup: {
            keyboard,
          },
        },
      );
      state[chatId].action = 'shorten';
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
    } else if (message === 'Random Link') {
      const url = state[chatId].url;
      const domain = state[chatId].selectedDomain;
      const shortenedURL = domain + '/' + nanoid();
      if (fullUrlOf[shortenedURL]) {
        bot.sendMessage(
          chatId,
          `Link already exists. Please send 'ok' to try another.`,
        );
        return;
      }
      fullUrlOf[shortenedURL] = url;

      linksOf[chatId] = (linksOf[chatId] || []).concat({ url, shortenedURL });

      totalShortLinks++;
      bot.sendMessage(
        chatId,
        `Your shortened URL is: ${shortenedURL}`,
        options,
      );
      delete state[chatId]?.url;
      delete state[chatId]?.action;
      delete state[chatId]?.selectedDomain;
    } else if (message === 'Custom Link') {
      state[chatId].action = 'shorten-custom';
      bot.sendMessage(
        chatId,
        `Please tell your us preferred short link extension: e.g payer`,
        {
          reply_markup: {
            keyboard: [['Back', 'Cancel']],
          },
        },
      );
      return;
    } else {
      bot.sendMessage(chatId, `?`);
    }
  }
  //
  else if (action === 'shorten-custom') {
    if (message === 'Back') {
      bot.sendMessage(chatId, `Choose link type:`, {
        reply_markup: {
          keyboard: [
            ['Random Link', 'Custom Link'],
            ['Back', 'Cancel'],
          ],
        },
      });
      state[chatId].action = 'choose-link-type';
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }

    const url = state[chatId].url;
    const domain = state[chatId].selectedDomain;
    const shortenedURL = domain + '/' + message;

    if (!isValidUrl('https://' + shortenedURL)) {
      bot.sendMessage(
        chatId,
        'Please provide a valid URL. e.g https://google.com',
      );
      return;
    }

    if (fullUrlOf[shortenedURL]) {
      bot.sendMessage(chatId, `Link already exists. Please try another.`);
      return;
    }

    fullUrlOf[shortenedURL] = url;

    linksOf[chatId] = (linksOf[chatId] || []).concat({ url, shortenedURL });

    totalShortLinks++;
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, options);
    delete state[chatId]?.url;
    delete state[chatId]?.action;
    delete state[chatId]?.selectedDomain;
  }

  //
  else if (message === '🌐 Buy a domain name') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, '📋 Subscribe to plans first');
      return;
    }
    state[chatId].action = 'choose-domain-to-buy';
    bot.sendMessage(
      chatId,
      'Please provide the domain name you would like to purchase.',
      {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      },
    );
  } else if (action === 'choose-domain-to-buy') {
    if (message === 'Back' || message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, options);
      return;
    }
    const domain = message.toLowerCase();
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(domain)) {
      bot.sendMessage(
        chatId,
        'Domain name is invalid. Please try another domain name.',
      );
      return;
    }

    const { available, price } = await checkDomainAvailability(
      domain,
      domainSold,
    );

    if (!available) {
      bot.sendMessage(
        chatId,
        'Domain is not available. Please try another domain name.',
        {
          reply_markup: {
            remove_keyboard: true,
          },
        },
      );
      return;
    }

    const sellingPrice = Math.ceil(price + price * 0.11); // 11% profit

    bot.sendMessage(
      chatId,
      `Price of ${domain} is ${sellingPrice} USD. Choose payment method.`,
      {
        reply_markup: {
          keyboard: [paymentOptions, ['Back', 'Cancel']],
        },
      },
    );

    state[chatId].chosenDomainForPayment = domain;
    state[chatId].chosenDomainPrice = sellingPrice;
    state[chatId].action = 'domain-name-payment';
  } else if (action === 'domain-name-payment') {
    if (message === 'Back') {
      state[chatId].action = 'choose-domain-to-buy';
      bot.sendMessage(
        chatId,
        'Please provide the domain name you would like to purchase.',
        {
          reply_markup: {
            keyboard: [['Back', 'Cancel']],
          },
        },
      );
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    const domain = state[chatId].chosenDomainForPayment;
    const price = state[chatId].chosenDomainPrice;
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', options);
      return;
    }

    if (paymentOption === 'Crypto') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: [
            ...cryptoTransferOptions.map(d => [d.toUpperCase()]),
            ['Back', 'Cancel'],
          ],
        },
      });
      state[chatId].action = 'crypto-transfer-payment-domain';
    } else {
      const priceNGN = Number(await convertUSDToNaira(price));
      const reference = nanoid();
      chatIdOfPayment[reference] = chatId;
      const { url, error } = await createCheckout(
        priceNGN,
        reference,
        '/bank-payment-for-domain',
      );

      if (error) {
        bot.sendMessage(chatId, error, options);
        delete state[chatId]?.action;
        return;
      }

      const inline_keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Make Payment',
                url,
              },
            ],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`,
        inline_keyboard,
      );
      bot.sendMessage(chatId, `Bank ₦aira + Card 🌐︎`, options);
      delete state[chatId]?.action;
    }
  } else if (action === 'crypto-transfer-payment-domain') {
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const priceUSD = state[chatId].chosenDomainPrice;
    const domain = state[chatId].chosenDomainForPayment;
    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (message === 'Back') {
      bot.sendMessage(
        chatId,
        `Price of ${domain} subscription is ${priceOf[domain]} USD. Choose payment method.`,
        {
          reply_markup: {
            keyboard: [paymentOptions, ['Back', 'Cancel']],
          },
        },
      );

      state[chatId].action = 'domain-name-payment';
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', options);
      return;
    }

    const ref = nanoid();
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-domain?a=b&ref=${ref}`,
    );

    chatIdOfPayment[address] = chatId;
    state[chatId].cryptoPaymentSession = {
      priceCrypto,
      ticker,
      ref,
    };

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to <code>${address}</code>Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...options,
      parse_mode: 'HTML',
    });
    delete state[chatId]?.action;

    // send QR Code Image
    const qrCode = await bb.getQrcode(priceCrypto);
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
  else if (message === '📋 Subscribe to plans') {
    if (isSubscribed(chatId)) {
      bot.sendMessage(
        chatId,
        'You are currently enrolled in a subscription plan.',
        options,
      );
      return;
    }

    state[chatId].action = 'choose-subscription';
    bot.sendMessage(
      chatId,
      'Select the perfect subscription plan for you:',
      chooseSubscription,
    );
  } else if (action === 'choose-subscription') {
    if (message === 'Back' || message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has pressed ${message} Button.`, options);
      return;
    }
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      bot.sendMessage(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    state[chatId].chosenPlanForPayment = plan;

    bot.sendMessage(
      chatId,
      `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`,
      {
        reply_markup: {
          keyboard: [paymentOptions, ['Back', 'Cancel']],
        },
      },
    );

    state[chatId].action = 'subscription-payment';
  } else if (action === 'subscription-payment') {
    if (message === 'Back') {
      state[chatId].action = 'choose-subscription';
      bot.sendMessage(
        chatId,
        'Select the perfect subscription plan for you:',
        chooseSubscription,
      );
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    const plan = state[chatId].chosenPlanForPayment;
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', options);
      return;
    }

    // call payment apis and send instructions to user and save
    // the payment to make in db so we can verify the payment when its received
    if (paymentOption === 'Crypto') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: [
            ...cryptoTransferOptions.map(d => [d.toUpperCase()]),
            ['Back', 'Cancel'],
          ],
        },
      });
      state[chatId].action = 'crypto-transfer-payment';
    } else {
      const priceNGN = Number(await convertUSDToNaira(priceOf[plan]));
      const reference = nanoid();
      chatIdOfPayment[reference] = chatId;
      const { url, error } = await createCheckout(
        priceNGN,
        reference,
        '/bank-payment-for-subscription',
      );

      if (error) {
        bot.sendMessage(chatId, error, options);
        delete state[chatId]?.action;
        return;
      }

      const inline_keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Make Payment',
                url,
              },
            ],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`,
        inline_keyboard,
      );
      bot.sendMessage(chatId, `Main Menu`, options);
      delete state[chatId]?.action;
    }
  } else if (action === 'crypto-transfer-payment') {
    if (message === 'Back') {
      const plan = state[chatId].chosenPlanForPayment;
      bot.sendMessage(
        chatId,
        `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`,
        {
          reply_markup: {
            keyboard: [paymentOptions, ['Back', 'Cancel']],
          },
        },
      );

      state[chatId].action = 'subscription-payment';
      return;
    } else if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, options);
      return;
    }
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const plan = state[chatId].chosenPlanForPayment;
    const priceUSD = priceOf[plan];
    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', options);
      return;
    }

    const ref = nanoid();
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-subscription?a=b&ref=${ref}`,
    );

    chatIdOfPayment[address] = chatId;
    state[chatId].cryptoPaymentSession = {
      priceCrypto,
      ticker,
      ref,
    };

    const text = `Please remit ${priceCrypto} ${ticker.toUpperCase()} to <code>${address}</code>Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...options,
      parse_mode: 'HTML',
    });
    delete state[chatId]?.action;

    // send QR Code Image
    const qrCode = await bb.getQrcode(priceCrypto);
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
  else if (message === '🔍 View my subscribed plan') {
    const subscribedPlan = state[chatId]?.subscription;

    if (subscribedPlan) {
      if (!isSubscribed(chatId)) {
        bot.sendMessage(
          chatId,
          `Your ${subscribedPlan} subscription is expired on ${new Date(
            planEndingTime[chatId],
          )}`,
        );
        return;
      }

      bot.sendMessage(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          planEndingTime[chatId],
        )}`,
      );
      return;
    }

    bot.sendMessage(chatId, 'You are not currently subscribed to any plan.');
  } else if (message === '🔍 View URL analytics') {
    const shortenedLinks = getShortenedLinks(chatId, linksOf, clicksOn);
    if (shortenedLinks.length > 0) {
      const linksText = shortenedLinks.join('\n');
      bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
    } else {
      bot.sendMessage(chatId, 'You have no shortened links yet.');
    }
  } else if (message === '👀 View my domains') {
    const purchasedDomains = getPurchasedDomains(chatId);
    if (purchasedDomains.length > 0) {
      const domainsText = purchasedDomains.join('\n');
      bot.sendMessage(
        chatId,
        `Here are your purchased domains:\n${domainsText}`,
      );
    } else {
      bot.sendMessage(chatId, 'You have no purchased domains yet.');
    }
  } else if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }
    backupTheData();
    bot.sendMessage(chatId, 'Backup created successfully.');
  } else if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }
    restoreData();
    bot.sendMessage(chatId, 'Data restored successfully.');
  } else if (message === 'View Users') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }

    bot.sendMessage(chatId, `Users:\n${users.join('\n')}`);
  } else if (message === 'View Analytics') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Apologies, but you do not have the authorization to access this content.',
      );
      return;
    }

    const analyticsData = getAnalyticsData();
    bot.sendMessage(chatId, `Analytics Data:\n${analyticsData}`);
  } else if (message === '🛠️ Support') {
    bot.sendMessage(chatId, 'Please contact @sport_chocolate');
  }
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

function getPurchasedDomains(chatId) {
  return domainsOf[chatId] || [];
}

function ownsDomainName(chatId) {
  return getPurchasedDomains(chatId).length > 0;
}

function isSubscribed(chatId) {
  return planEndingTime[chatId] && planEndingTime[chatId] > Date.now();
}

function getAnalyticsData() {
  let res = `Total short links: ${totalShortLinks}\n`;
  for (const key in clicksOf) {
    res += `Clicks in ${key}: ${clicksOf[key]}\n`;
  }

  return res;
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
    Object.assign(nameOfChatId, restoredData.nameOfChatId);
    Object.assign(chatIdOfName, restoredData.chatIdOfName);
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
    nameOfChatId,
    chatIdOfName,
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
  if (domainSold[domain]) {
    return { error: 'Already registered' };
  }
  domainSold[domain] = true;

  domainsOf[chatId] = (domainsOf[chatId] || []).concat(domain);

  // return { success: true };
  return await buyDomainOnline(domain);
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
  const chatId = chatIdOfPayment[reference];
  if (state[chatId]?.chosenPlanForPayment) {
    const plan = state[chatId].chosenPlanForPayment;
    planEndingTime[chatId] = Date.now() + timeOf[plan];
    state[chatId].subscription = plan;

    delete chatIdOfPayment[reference]; // Save Tx
    delete state[chatId]?.chosenPlanForPayment; // Save Tx

    bot.sendMessage(
      chatId,
      `Your payment was successful, and you're now subscribed to our ${plan} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,
      options,
    );
    res.send('Payment processed successfully');
  } else {
    res.send('Payment already processed or not found');
  }
});
app.get('/bank-payment-for-domain', async (req, res) => {
  console.log(req.originalUrl);
  const reference = req.query.reference;
  const chatId = chatIdOfPayment[reference];
  if (state[chatId]?.chosenDomainForPayment) {
    const domain = state[chatId].chosenDomainForPayment;
    const { error: buyDomainError } = await buyDomain(chatId, domain);
    if (buyDomainError) {
      bot.sendMessage(chatId, 'Domain purchase fails, try another name.', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return;
    }
    bot.sendMessage(
      chatId,
      `Your payment is processed and domain ${domain} is now yours. Enjoy URL shortening with your new domain. Thanks for choosing us.

Best,
Nomadly Bot`,
      options,
    );

    const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
    if (error) {
      bot.sendMessage(chatId, `Error saving domain in server`, {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return;
    }

    bot.sendMessage(chatId, `Linking domain with your account...`); // save railway in domain
    const { error: saveServerInDomainError } = await saveServerInDomain(
      domain,
      server,
    );

    if (saveServerInDomainError) {
      bot.sendMessage(
        chatId,
        `Error saving server in domain ${saveServerInDomainError}`,
        {
          reply_markup: {
            remove_keyboard: true,
          },
        },
      );
      return;
    }

    bot.sendMessage(
      chatId,
      `Your domain ${domain} is now linked to your account. Please note that DNS update might take up to 1hr. Enjoy URL shortening. 😇`,
    );

    delete chatIdOfPayment[reference]; // Save Tx
    delete state[chatId]?.chosenDomainPrice; // Save Tx
    delete state[chatId]?.chosenDomainForPayment; // Save Tx

    res.send('Payment processed successfully');
  } else {
    res.send('Payment already processed or not found');
  }
});
app.get('/crypto-payment-for-subscription', (req, res) => {
  // handle multiple invocations of the same url
  const urlParams = new URLSearchParams(req.originalUrl);

  const address_in = urlParams.get('address_in');
  const coin = urlParams.get('coin');
  const price = urlParams.get('price');
  const refReceived = urlParams.get('ref');
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !price || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.send('Invalid payment data');
    return;
  }

  const chatId = chatIdOfPayment[address_in];

  if (state[chatId]?.cryptoPaymentSession) {
    const { priceCrypto, ticker, ref } = state[chatId].cryptoPaymentSession;
    const price = Number(priceCrypto) + Number(priceCrypto) * 0.06;
    console.log({ value_coin, priceCrypto, price });
    if (value_coin >= price && coin === ticker && ref === refReceived) {
      const plan = state[chatId].chosenPlanForPayment;
      planEndingTime[chatId] = Date.now() + timeOf[plan];
      state[chatId].subscription = plan;
      bot.sendMessage(
        chatId,
        `Your payment was successful, and you're now subscribed to our ${plan} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,
        options,
      );

      delete state[chatId]?.chosenPlanForPayment; // Save Tx
      delete state[chatId]?.cryptoPaymentSession; // Save Tx
      res.send('Payment data received and processed successfully');
    } else {
      console.log(req.originalUrl);
      res.send('Wrong coin or wrong price');
    }
  } else {
    res.send('Payment issue, no crypto payment session found');
    console.log('No crypto payment session found ' + req.originalUrl);
  }
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

  const chatId = chatIdOfPayment[address_in];

  if (state[chatId]?.cryptoPaymentSession) {
    const { priceCrypto, ticker, ref } = state[chatId].cryptoPaymentSession;
    const price = Number(priceCrypto) + Number(priceCrypto) * 0.06;
    console.log({ value_coin, priceCrypto, price });
    if (value_coin >= price && coin === ticker && ref === refReceived) {
      if (state[chatId]?.chosenDomainForPayment) {
        const domain = state[chatId].chosenDomainForPayment;
        const { error: buyDomainError } = await buyDomain(chatId, domain);
        if (!buyDomainError) {
          bot.sendMessage(chatId, 'Domain purchase fails, try another name.', {
            reply_markup: {
              remove_keyboard: true,
            },
          });
          return;
        }
        bot.sendMessage(
          chatId,
          `Your payment is processed and domain ${domain} is now yours. Enjoy URL shortening with your new domain. Thanks for choosing us.

Best,
Nomadly Bot`,
          options,
        );

        const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
        if (error) {
          bot.sendMessage(chatId, `Error saving domain in server`, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
          return;
        }

        bot.sendMessage(chatId, `Linking domain with your account...`); // save railway in domain
        const { error: saveServerInDomainError } = await saveServerInDomain(
          domain,
          server,
        );

        if (saveServerInDomainError) {
          bot.sendMessage(
            chatId,
            `Error saving server in domain ${saveServerInDomainError}`,
            {
              reply_markup: {
                remove_keyboard: true,
              },
            },
          );
          return;
        }

        bot.sendMessage(
          chatId,
          `Your domain ${domain} is now linked to your account. Please note that DNS update might take up to 1hr. Enjoy URL shortening. 😇`,
        );

        delete state[chatId]?.chosenDomainPrice; // Save Tx
        delete state[chatId]?.cryptoPaymentSession; // Save Tx
        delete state[chatId]?.chosenDomainForPayment; // Save Tx

        res.send('Payment processed successfully');
      } else {
        res.send('Payment already processed or not found');
      }
    } else {
      console.log(`crypto payment session error ${req.originalUrl}`);
      res.send(
        'Payment invalid, either less value sent or coin sent is not correct',
      );
    }
  } else {
    console.log('issue', state[chatId]);
    res.send('Payment session not found, please try again or contact support');
  }
});
app.get('/get-json-data', async (req, res) => {
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
  const url = fullUrlOf[shortUrl];
  if (url) {
    clicksOf['total'] = (clicksOf['total'] || 0) + 1;
    clicksOf[today()] = (clicksOf[today()] || 0) + 1;
    clicksOf[week()] = (clicksOf[week()] || 0) + 1;
    clicksOf[month()] = (clicksOf[month()] || 0) + 1;
    clicksOf[year()] = (clicksOf[year()] || 0) + 1;

    clicksOn[shortUrl] = (clicksOn[shortUrl] || 0) + 1;

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
