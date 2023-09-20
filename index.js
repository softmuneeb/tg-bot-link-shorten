const TelegramBot = require('node-telegram-bot-api');
const { createCheckout } = require('./fincra.js');
const { customAlphabet } = require('nanoid');
const express = require('express');
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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SELF_URL = process.env.SELF_URL;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const state = {};
const linksOf = {};
const chatIdOf = {};
const fullUrlOf = {};
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

    bot.sendMessage(
      chatId,
      'Please provide the username of the user to kick:',
      {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      },
    );
    state[chatId].action = 'kick-user';
  } else if (action === 'kick-user') {
    if (message === 'Back') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Back Button.`, adminOptions);
      return;
    }
    if (message === 'Cancel') {
      delete state[chatId]?.action;
      bot.sendMessage(chatId, `User has Pressed Cancel Button.`, adminOptions);
      return;
    }
    const userToKick = message;
    const kicked = kickUser(userToKick);
    if (kicked) {
      bot.sendMessage(
        chatId,
        `User ${userToKick} has been kicked out.`,
        adminOptions,
      );
    } else {
      bot.sendMessage(
        chatId,
        `User ${userToKick} not found or unable to kick.`,
        adminOptions,
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
    bot.sendMessage(chatId, 'Please provide the URL you want to shorten:', {
      reply_markup: {
        keyboard: [['Back', 'Cancel']],
      },
    });
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
      bot.sendMessage(chatId, 'Please provide a valid URL', {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    }

    const domains = getPurchasedDomains(chatId);
    const keyboard = [...domains.map(d => [d]), ['Back', 'Cancel']];
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
    if (message === 'Back') {
      state[chatId].action = 'choose-domain';
      bot.sendMessage(chatId, `Please Chose the URL to shorten.`, {
        reply_markup: {
          keyboard: [['Back', 'Cancel']],
        },
      });
      return;
    }
    if (message === 'Cancel') {
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
    state[chatId].action = 'choose-domain-to-buy';
    bot.sendMessage(chatId, 'Please enter the desired domain name:', {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  } else if (action === 'choose-domain-to-buy') {
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
          keyboard: [paymentOptions],
        },
      },
    );

    state[chatId].chosenDomainForPayment = domain;
    state[chatId].chosenDomainPrice = sellingPrice;
    state[chatId].action = 'domain-name-payment';
  } else if (action === 'domain-name-payment') {
    const domain = state[chatId].chosenDomainForPayment;
    const price = state[chatId].chosenDomainPrice;
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option', options);
      return;
    }

    if (paymentOption === 'Crypto Transfer') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: cryptoTransferOptions.map(d => [d.toUpperCase()]),
        },
      });
      state[chatId].action = 'crypto-transfer-payment-domain';
    } else {
      const priceNGN = Number(await convertUSDToNaira(price));
      const reference = nanoid();
      chatIdOf[reference] = chatId;
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
        `Pay ${priceNGN} NGN for ${domain} and you will receive a payment confirmation here.`,
        inline_keyboard,
      );
      delete state[chatId]?.action;
    }
  } else if (action === 'crypto-transfer-payment-domain') {
    const ticker = message.toLowerCase(); // https://blockbee.io/cryptocurrencies
    const priceUSD = state[chatId].chosenDomainPrice;
    const domain = state[chatId].chosenDomainForPayment;
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
      '/crypto-payment-for-domain',
    );

    chatIdOf[address] = chatId;
    state[chatId].cryptoPaymentSession = {
      priceCrypto,
      ticker,
    };
    bot.sendMessage(
      chatId,
      `Deposit ${priceCrypto} ${ticker.toUpperCase()} at this address \`\`\`${address}\`\`\` to buy ${domain} and you will receive a payment confirmation here.`,
      { ...options, parse_mode: 'markdown' },
    );
    bot.sendPhoto(chatId, Buffer.from(qrCode, 'base64'));
    delete state[chatId]?.action;
  }
  //
  else if (message === 'Subscribe to plans') {
    if (isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'You are already subscribed to a plan', options);
      return;
    }

    state[chatId].action = 'choose-subscription';
    bot.sendMessage(chatId, 'Choose a subscription plan:', chooseSubscription);
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
        'Choose a subscription plan:',
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
    if (paymentOption === 'Crypto Transfer') {
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
      chatIdOf[reference] = chatId;
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
        `Pay ${priceNGN} NGN and you will receive a payment confirmation here.`,
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

    const { address, qrCode } = await getCryptoDepositAddress(
      priceCrypto,
      ticker,
      chatId,
      SELF_URL,
      '/crypto-payment-for-subscription',
    );

    chatIdOf[address] = chatId;
    state[chatId].cryptoPaymentSession = {
      priceCrypto,
      ticker,
    };
    bot.sendMessage(
      chatId,
      `Deposit ${priceCrypto} ${ticker.toUpperCase()} at this address \`\`\`${address}\`\`\` to subscribe to ${plan} plan and you will receive a payment confirmation here.`,
      { ...options, parse_mode: 'markdown' },
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
  const shortenedURL = domain + '/' + nanoid();
  const data = { url, shortenedURL };
  linksOf[chatId] = linksOf[chatId] ? linksOf[chatId].concat(data) : [data];
  fullUrlOf[shortenedURL] = url;
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
    Object.assign(fullUrlOf, restoredData.fullUrlOf);
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
    fullUrlOf,
    domainsOf,
    domainSold,
    planEndingTime,
  };

  const backupJSON = JSON.stringify(backupData, null, 2);
  fs.writeFileSync('backup.json', backupJSON, 'utf-8');
  console.log('Backup created. ', backupJSON);
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

console.log('Bot is running...');

const app = express();
app.use(cors());
app.set('json spaces', 2);
app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});
app.get('/bank-payment-for-subscription', (req, res) => {
  console.log(req.originalUrl);
  const reference = req.query.reference;
  const chatId = chatIdOf[reference];
  if (state[chatId]?.chosenPlanForPayment) {
    const plan = state[chatId].chosenPlanForPayment;
    planEndingTime[chatId] = Date.now() + timeOf[plan];
    state[chatId].subscription = plan;

    delete chatIdOf[reference]; // Save Tx
    delete state[chatId]?.chosenPlanForPayment; // Save Tx

    bot.sendMessage(
      chatId,
      `Payment received successfully! You are now subscribed to the ${plan} plan. Enjoy URL shortening by purchasing your own domain names.`,
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
  const chatId = chatIdOf[reference];
  if (state[chatId]?.chosenDomainForPayment) {
    const domain = state[chatId].chosenDomainForPayment;
    const { error: buyDomainError } = await buyDomain(chatId, domain);
    if (buyDomainError) {
      bot.sendMessage(chatId, 'Domain purchase fail, try another name', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return;
    }
    bot.sendMessage(
      chatId,
      `Payment successful! You have bought ${domain}`,
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

    bot.sendMessage(chatId, `Successfully saved domain in server`); // save railway in domain
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
      `Successfully saved server in domain. You can now enjoy URL shortening with ${domain}`,
    );

    delete chatIdOf[reference]; // Save Tx
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
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !price || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.send('Invalid payment data');
    return;
  }

  const chatId = chatIdOf[address_in];

  if (state[chatId]?.cryptoPaymentSession) {
    const { priceCrypto, ticker } = state[chatId].cryptoPaymentSession;

    if (value_coin >= Number(priceCrypto) && coin === ticker) {
      const plan = state[chatId].chosenPlanForPayment;
      planEndingTime[chatId] = Date.now() + timeOf[plan];
      state[chatId].subscription = plan;
      bot.sendMessage(
        chatId,
        `${value_coin.toUpperCase()} ${coin} received successfully! You are now subscribed to the ${plan} plan. Enjoy URL shortening by purchasing your own domain names.`,
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
  const value_coin = Number(urlParams.get('value_coin'));

  if (!coin || !address_in || !value_coin) {
    console.log('Invalid payment data ' + req.originalUrl);
    res.send('Invalid payment data');
    return;
  }

  const chatId = chatIdOf[address_in];

  if (state[chatId]?.cryptoPaymentSession) {
    const { priceCrypto, ticker } = state[chatId].cryptoPaymentSession;

    if (value_coin >= Number(priceCrypto) && coin === ticker) {
      if (state[chatId]?.chosenDomainForPayment) {
        const domain = state[chatId].chosenDomainForPayment;
        const { error: buyDomainError } = await buyDomain(chatId, domain);
        if (!buyDomainError) {
          bot.sendMessage(chatId, 'Domain purchase fail, try another name', {
            reply_markup: {
              remove_keyboard: true,
            },
          });
          return;
        }
        bot.sendMessage(
          chatId,
          `Payment successful! You have bought ${domain}`,
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

        bot.sendMessage(chatId, `Successfully saved domain in server`); // save railway in domain
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
          `Successfully saved server in domain. You can now enjoy URL shortening with ${domain}`,
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
app.get('/get-json-data', (req, res) => {
  backupTheData();
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
  const url = fullUrlOf[`${req.hostname}/${id}`];
  if (url) {
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

// getCryptoDepositAddress(
//   '0.55',
//   'polygon_matic',
//   '6687923716',
//   'https://softgreen.com',
// ).then(async a => {
// bot.sendMessage('6687923716', 'Bot is running', options);
// bot.sendPhoto('6687923716', Buffer.from(a.qrCode, 'base64'));
//   bot.sendMessage(
//     '6687923716',
//     `Deposit \`\`\`${a.address}\`\`\` to buy, you will receive a payment confirmation here.`,
//     { ...options, parse_mode: 'markdown' },
//   );
// });

// saveServerInDomain('gogasoftsbs.sbs', 'test.server');
