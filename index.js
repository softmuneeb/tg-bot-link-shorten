const TelegramBot = require('node-telegram-bot-api');
const { startServer } = require('./api.js');
const shortid = require('shortid');
const dotenv = require('dotenv');
const fs = require('fs');
const {
  instructionsOf,
  priceOf,
  adminOptions,
  devOptions,
  options,
  instructionsOfDomainPayment,
  paymentOptions,
  subscriptionOptions,
  cryptoTransferOptions,
} = require('./config.js');

const {
  isValidUrl,
  isNormalUser,
  isDeveloper,
  isAdmin,
  checkDomainAvailability,
} = require('./utils.js');
const { getCryptoDepositAddress } = require('./blockbee.js');
const { getBankDepositAddress } = require('./fincra.js');
dotenv.config();
startServer();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const state = {};
const linksOf = {};
const domainsOf = {};
const domainSold = {};
const planEndingTime = {};

restoreData();
bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is the admin
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
});

bot.onText(/See My Analytics/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is a normal user
  if (isNormalUser(chatId)) {
    // Implement logic to show analytics to the user
    // For example, you can send a message with analytics data
    bot.sendMessage(chatId, 'Here are your analytics data...');
  } else {
    bot.sendMessage(chatId, 'You are not authorized to view analytics.');
  }
});

bot.onText(/See All Analytics/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is the admin
  if (!isAdmin(chatId)) {
    bot.sendMessage(chatId, 'You are not authorized to view analytics.');
    return;
  }

  // Implement logic to retrieve and display analytics
  // Replace with your own logic to fetch analytics data
  const analyticsData = getAnalyticsData(); // Stubbed function
  bot.sendMessage(chatId, `Analytics Data:\n${analyticsData}`);
});

bot.onText(/Kick Out User/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is the admin
  if (!isAdmin(chatId)) {
    bot.sendMessage(chatId, 'You are not authorized to kick out users.');
    return;
  }

  bot.sendMessage(chatId, 'Please provide the username of the user to kick:');
  state[chatId].action = 'kick-user';
});

bot.onText(/Backup Data/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is a developer
  if (!isDeveloper(chatId)) {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
    return;
  }

  // Call the backup function
  backupTheData();
  bot.sendMessage(chatId, 'Backup created successfully.');
});

bot.onText(/Restore Data/, msg => {
  const chatId = msg.chat.id;

  // Check if the user is a developer
  if (!isDeveloper(chatId)) {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
    return;
  }

  // Call the restore function
  restoreData();
  bot.sendMessage(chatId, 'Data restored successfully.');
});

bot.onText(/Shorten a URL/, msg => {
  const chatId = msg.chat.id;

  // he must own a subscription
  if (!isSubscribed(chatId)) {
    bot.sendMessage(chatId, 'Subscribe to plans first');
    return;
  }
  // he must own a domain name
  if (!ownsDomainName(chatId)) {
    bot.sendMessage(chatId, 'Buy a domain first');
    return;
  }

  state[chatId].action = 'choose-domain';
  bot.sendMessage(chatId, 'Please provide the URL you want to shorten:');
});

bot.onText(/Buy a domain name/, msg => {
  const chatId = msg.chat.id;

  // he must own a subscription
  if (!isSubscribed(chatId)) {
    bot.sendMessage(chatId, 'Subscribe to plans first');
    return;
  }
  state[chatId].action = 'buy';
  bot.sendMessage(chatId, 'Please enter the desired domain name:', {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});
const chooseSubscription = {
  reply_markup: {
    keyboard: subscriptionOptions.map(a => [a]),
  },
};
bot.onText(/Subscribe to plans/, msg => {
  const chatId = msg.chat.id;

  if (isSubscribed(chatId)) {
    bot.sendMessage(chatId, 'You are already subscribed to a plan', options);
    return;
  }

  state[chatId].action = 'choose-plan';
  bot.sendMessage(chatId, 'Choose a subscription plan:', chooseSubscription);
});

bot.onText(/See my subscribed plan/, msg => {
  const chatId = msg.chat.id;
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
});

bot.onText(/See my shortened links/, msg => {
  const chatId = msg.chat.id;
  // Implement logic to retrieve and display shortened links
  const shortenedLinks = getShortenedLinks(chatId); // Stubbed function
  if (shortenedLinks.length > 0) {
    const linksText = shortenedLinks.join('\n');
    bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
  } else {
    bot.sendMessage(chatId, 'You have no shortened links yet.');
  }
});

bot.onText(/See my domains/, msg => {
  const chatId = msg.chat.id;
  // Implement logic to retrieve and display purchased domains
  const purchasedDomains = getPurchasedDomains(chatId); // Stubbed function
  if (purchasedDomains.length > 0) {
    const domainsText = purchasedDomains.join('\n');
    bot.sendMessage(chatId, `Here are your purchased domains:\n${domainsText}`);
  } else {
    bot.sendMessage(chatId, 'You have no purchased domains yet.');
  }
});

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  if (!state[chatId]) state[chatId] = {};

  const action = state[chatId]?.action;

  if (message === '/start') return; // to avoid duplicate messages

  if (action === 'choose-plan') {
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      bot.sendMessage(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    state[chatId].chosenPlanForPayment = plan;

    // Send payment options
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
  } else if (action === 'buy') {
    // Implement logic to check domain availability and process purchase

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
    ); // Stubbed function

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

    // Send payment instructions to the user
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
      const domainPurchaseSuccess = buyDomain(chatId, domain); // Stubbed function

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
      const {
        accountNumber,
        accountName,
        bankName,
        bankCode,
        _id,
        business,
        error,
      } = await getBankDepositAddress(priceOf[plan], chatId);
      // save [chatId, _id, business, plan] in db to verify received amount later

      if (error) {
        bot.sendMessage(chatId, error, options);
        delete state[chatId]?.action;
        return;
      }

      bot.sendMessage(
        chatId,
        `Deposit Naira at this bank account and you will receive a payment confirmation here.

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
    if (!cryptoTransferOptions.includes(ticker)) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency', options);
      return;
    }

    const cryptoDepositAddress = await getCryptoDepositAddress(ticker, {
      chatId,
    });
    bot.sendMessage(
      chatId,
      `Deposit ${ticker.toUpperCase()} at this address \`${cryptoDepositAddress}\` and you will receive a payment confirmation here.`,
      options,
    );
    delete state[chatId]?.action;
  } else if (action === 'kick-user') {
    // Implement logic to kick out the specified user
    const userToKick = message;
    const kicked = kickUser(userToKick); // Stubbed function
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
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

// Stubbed functions for demonstration purposes
function getShortenedLinks(chatId) {
  return !linksOf[chatId]
    ? []
    : linksOf[chatId].map(d => `${d.shortenedURL} -> ${d.url}`); // Replace with actual logic
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

// Stubbed function for demonstration purposes
function getAnalyticsData() {
  return 'Analytics data will be shown here.';
}

// Stubbed function for demonstration purposes
function kickUser(username) {
  // Implement logic to kick out the specified user
  // Return true if successful, false otherwise
  return true; // Change this based on your actual implementation
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8');
    const restoredData = JSON.parse(backupJSON);

    Object.assign(state, restoredData.state);
    Object.assign(linksOf, restoredData.linksOf);
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
