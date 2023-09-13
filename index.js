const { getBankDepositAddress } = require('./fincra.js');
const TelegramBot = require('node-telegram-bot-api');
const shortid = require('shortid');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const {
  priceOf,
  adminOptions,
  devOptions,
  options,
  instructionsOfDomainPayment,
  paymentOptions,
  subscriptionOptions,
  cryptoTransferOptions,
  timeOf,
} = require('./config.js');
const {
  isValidUrl,
  isNormalUser,
  isDeveloper,
  isAdmin,
  checkDomainAvailability,
  convertUSDToNaira,
} = require('./utils.js');
const {
  getCryptoDepositAddress,
  convertUSDToCrypto,
} = require('./blockbee.js');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SELF_URL = process.env.SELF_URL;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const state = {};
const linksOf = {};
const chatIdOf = {};
const domainsOf = {};
const domainSold = {};
const planEndingTime = {};

restoreData();

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  if (!state[chatId]) state[chatId] = {};

  const action = state[chatId]?.action;

  if (message === '/start') {
    if (isAdmin(chatId)) {
      bot.sendMessage(
        chatId,
        'Welcome, Admin! Please select an option:',
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
        'Welcome to the URL Shortener Bot! Please select an option:',
        options,
      );
    }
  }
  //
  else if (message === 'Kick Out User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'You are not authorized to kick out users.');
      return;
    }

    bot.sendMessage(chatId, 'Please provide the username of the user to kick:');
    state[chatId].action = 'kick-user';
  } else if (action === 'kick-user') {
    const userToKick = message;
    const kicked = kickUser(userToKick);
    if (kicked) {
      bot.sendMessage(chatId, `User ${userToKick} has been kicked out.`);
    } else {
      bot.sendMessage(
        chatId,
        `User ${userToKick} not found or unable to kick.`,
      );
    }
    delete state[chatId]?.action;
  }
  //
  else if (message === 'Shorten a URL') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'Subscribe to plans first');
      return;
    }
    if (!ownsDomainName(chatId)) {
      bot.sendMessage(chatId, 'Buy a domain first');
      return;
    }
    state[chatId].action = 'choose-domain';
    bot.sendMessage(chatId, 'Please provide the URL you want to shorten:');
  } else if (action === 'choose-domain') {
    if (!isValidUrl(message)) {
      bot.sendMessage(chatId, 'Please provide a valid URL');
      return;
    }

    const domains = getPurchasedDomains(chatId);
    const keyboard = [domains];
    bot.sendMessage(
      chatId,
      `Please choose the domain you want to link with your short link`,
      {
        reply_markup: {
          keyboard,
        },
      },
    );
    state[chatId].action = 'shorten';
    state[chatId].url = message;
  } else if (action === 'shorten') {
    const domains = getPurchasedDomains(chatId);
    if (!domains.includes(message)) {
      bot.sendMessage(chatId, 'Please choose a valid domain');
      return;
    }

    const domain = message;
    const shortenedURL = shortenURLAndSave(chatId, domain, state[chatId].url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, options);
    delete state[chatId]?.url;
    delete state[chatId]?.action;
  }
  //
  else if (message === 'Buy a domain name') {
    if (!isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'Subscribe to plans first');
      return;
    }
    state[chatId].action = 'choose-domain';
    bot.sendMessage(chatId, 'Please enter the desired domain name:', {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  } else if (action === 'choose-domain') {
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(message)) {
      bot.sendMessage(
        chatId,
        'Domain name is invalid. Please try another domain name.',
      );
      return;
    }
    const domain = message.toLowerCase();

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

    const sellingPrice = parseInt(price + price * 0.11); // 11% profit

    bot.sendMessage(
      chatId,
      `Price of ${domain} is ${sellingPrice} USD. Choose payment method.`,
      {
        reply_markup: {
          keyboard: [paymentOptions],
        },
      },
    );

    state[chatId].selectedDomainForPayment = domain;

    state[chatId].action = 'domain-name-payment';
  } else if (action === 'domain-name-payment') {
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', options);
      return;
    }

    bot.sendMessage(
      chatId,
      instructionsOfDomainPayment[paymentOption],
      options,
    );
    delete state[chatId]?.action;

    // Simulate Payment Made
    setTimeout(() => {
      // handle plan config in webhook endpoint
      const domain = state[chatId].selectedDomainForPayment;
      const domainPurchaseSuccess = buyDomain(chatId, domain);

      if (!domainPurchaseSuccess) {
        bot.sendMessage(chatId, 'Domain purchase fail, try another name', {
          reply_markup: {
            remove_keyboard: true,
          },
        });
        return;
      }

      delete state[chatId].selectedDomainForPayment;
      bot.sendMessage(
        chatId,
        `Payment successful! You have bought ${domain}. Enjoy URL shortening with your purchased domain name.`,
        options,
      );
      //
    }, 1000);
  }
  //
  else if (message === 'Subscribe to plans') {
    const chooseSubscription = {
      reply_markup: {
        keyboard: subscriptionOptions.map(a => [a]),
      },
    };

    if (isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'You are already subscribed to a plan', options);
      return;
    }

    state[chatId].action = 'choose-subscription';
    bot.sendMessage(chatId, 'Choose a subscription plan:', chooseSubscription);
  } else if (action === 'choose-subscription') {
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
          keyboard: [paymentOptions],
        },
      },
    );

    state[chatId].action = 'subscription-payment';
  } else if (action === 'subscription-payment') {
    const plan = state[chatId].chosenPlanForPayment;
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', options);
      return;
    }

    // call payment apis and send instructions to user and save
    // the payment to make in db so we can verify the payment when its received
    if (paymentOption === 'Crypto Transfer') {
      bot.sendMessage(
        chatId,
        `Please choose a crypto currency to transfer to`,
        {
          reply_markup: {
            keyboard: cryptoTransferOptions.map(d => [d.toUpperCase()]),
          },
        },
      );
      state[chatId].action = 'crypto-transfer-payment';
    } else {
      const priceNGN = await convertUSDToNaira(priceOf[plan]);

      const {
        accountNumber,
        accountName,
        bankName,
        bankCode,
        _id,
        business,
        error,
      } = await getBankDepositAddress(priceNGN, chatId);
      // save [chatId, _id, business, plan] in db to verify received amount later

      if (error) {
        bot.sendMessage(chatId, error, options);
        delete state[chatId]?.action;
        return;
      }

      bot.sendMessage(
        chatId,
        `Deposit ${priceNGN} NGN at this bank account and you will receive a payment confirmation here.

Account Number ${accountNumber}
Account Name ${accountName}
Bank Name ${bankName}
Bank Code ${bankCode}`,
        options,
      );
      delete state[chatId]?.action;
    }
  } else if (action === 'crypto-transfer-payment') {
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const plan = state[chatId].chosenPlanForPayment;
    const priceUSD = priceOf[plan];
    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', options);
      return;
    }

    const { address, qrCode } = await getCryptoDepositAddress(
      priceCrypto,
      ticker,
      chatId,
      SELF_URL,
    );

    chatIdOf[address] = chatId;
    state[chatId].cryptoPaymentSession = {
      priceCrypto,
      ticker,
    };
    bot.sendMessage(
      chatId,
      `Deposit ${priceCrypto} ${ticker.toUpperCase()} at this address ${address} and you will receive a payment confirmation here.`,
      options,
    );
    bot.sendPhoto(chatId, Buffer.from(qrCode, 'base64'));
    delete state[chatId]?.action;
  }
  //
  else if (message === 'See my subscribed plan') {
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
  } else if (message === 'See my shortened links') {
    const shortenedLinks = getShortenedLinks(chatId);
    if (shortenedLinks.length > 0) {
      const linksText = shortenedLinks.join('\n');
      bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
    } else {
      bot.sendMessage(chatId, 'You have no shortened links yet.');
    }
  } else if (message === 'See my domains') {
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
      bot.sendMessage(chatId, 'You are not authorized to perform this action.');
      return;
    }
    backupTheData();
    bot.sendMessage(chatId, 'Backup created successfully.');
  } else if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'You are not authorized to perform this action.');
      return;
    }
    restoreData();
    bot.sendMessage(chatId, 'Data restored successfully.');
  } else if (message === 'See All Analytics') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'You are not authorized to view analytics.');
      return;
    }

    const analyticsData = getAnalyticsData();
    bot.sendMessage(chatId, `Analytics Data:\n${analyticsData}`);
  } else if (message === 'See My Analytics') {
    bot.sendMessage(chatId, 'Here are your analytics data...');
  }
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

function getShortenedLinks(chatId) {
  return !linksOf[chatId]
    ? []
    : linksOf[chatId].map(d => `${d.shortenedURL} -> ${d.url}`);
}

function getPurchasedDomains(chatId) {
  return domainsOf[chatId] || [];
}

function ownsDomainName(chatId) {
  return getPurchasedDomains(chatId).length > 0;
}

function isSubscribed(chatId) {
  return planEndingTime[chatId] && planEndingTime[chatId] > Date.now();
}

// its not pure function // may need to refactor
function shortenURLAndSave(chatId, domain, url) {
  const shortenedURL = domain + '/' + shortid.generate();
  const data = { url, shortenedURL };
  linksOf[chatId] = linksOf[chatId] ? linksOf[chatId].concat(data) : [data];
  return shortenedURL;
}

function getAnalyticsData() {
  return 'Analytics data will be shown here.';
}

function kickUser(username) {
  return true;
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8');
    const restoredData = JSON.parse(backupJSON);

    Object.assign(state, restoredData.state);
    Object.assign(linksOf, restoredData.linksOf);
    Object.assign(chatIdOf, restoredData.chatIdOf);
    Object.assign(domainsOf, restoredData.domainsOf);
    Object.assign(domainSold, restoredData.domainSold);
    Object.assign(planEndingTime, restoredData.planEndingTime);

    console.log('Data restored.');
  } catch (error) {
    console.error('Error restoring data:', error.message);
  }
}

function backupTheData() {
  const backupData = {
    state,
    linksOf,
    chatIdOf,
    domainsOf,
    domainSold,
    planEndingTime,
  };

  const backupJSON = JSON.stringify(backupData, null, 2);
  fs.writeFileSync('backup.json', backupJSON, 'utf-8');
  console.log('Backup created. ', backupJSON);
}

function buyDomain(chatId, domain) {
  // check dns records
  if (domainSold[domain]) {
    return false;
  }
  domainSold[domain] = true;

  domainsOf[chatId] = (domainsOf[chatId] || []).concat(domain);

  return true;
}

console.log('Bot is running...');

const app = express();
app.use(cors());
app.set('json spaces', 2);
app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});
app.get('/save-payment-blockbee', (req, res) => {
  const urlParams = new URLSearchParams(req.originalUrl);

  const address_in = urlParams.get('address_in');
  const coin = urlParams.get('coin');
  const price = urlParams.get('price');
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !price || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.json({ message: 'Invalid payment data' });
    return;
  }

  const chatId = chatIdOf[address_in];

  if (state[chatId]?.cryptoPaymentSession) {
    const { priceCrypto, ticker } = state[chatId].cryptoPaymentSession;

    if (value_coin >= Number(priceCrypto) && coin === ticker.toLowerCase()) {
      const plan = state[chatId].chosenPlanForPayment;
      planEndingTime[chatId] = Date.now() + timeOf[plan];
      state[chatId].subscription = plan;
      bot.sendMessage(
        chatId,
        `Payment received successfully! You are now subscribed to the ${plan} plan. Enjoy URL shortening by purchasing your own domain names.`,
        options,
      );

      delete state[chatId]?.chosenPlanForPayment;
      delete state[chatId]?.action;
      delete state[chatId]?.cryptoPaymentSession;
    } else {
      bot.sendMessage(chatId, 'Payment failed');
      console.log(`Debug ${req.originalUrl}`);
    }
  } else {
    console.log('issue', state[chatId]);
  }

  res.json({ message: 'Payment data received and processed successfully' });
});
app.get('/get-json-data', (req, res) => {
  fs.readFile('backup.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  });
});
const startServer = () => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};
startServer();

// getCryptoDepositAddress(
//   '0.55',
//   'polygon_matic',
//   '6687923716',
//   'https://softgreen.com',
// ).then(async a => {
//   bot.sendMessage('6687923716', 'Bot is running', options);
//   bot.sendPhoto('6687923716', Buffer.from(a.qrCode.qr_code, 'base64'));
// });
