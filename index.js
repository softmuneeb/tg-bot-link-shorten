const TelegramBot = require('node-telegram-bot-api');
const { startServer } = require('./api.js');
const shortid = require('shortid');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();
startServer();


const DEVELOPER_CHAT_ID = 5729797630;
const ADMIN_CHAT_ID = 5729797630;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const adminOptions = {
  reply_markup: {
    keyboard: [['See All Analytics'], ['Kick Out User']],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const devOptions = {
  reply_markup: {
    keyboard: [['Backup Data'], ['Restore Data']],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const options = {
  reply_markup: {
    keyboard: [
      ['Shorten a URL'],
      ['See my shortened links'],
      ['See My Analytics'],
      ['Buy a domain name'],
      ['See my domains'],
      ['Subscribe to plans'],
      ['See my subscribed plan'],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const state = {};
const linksOf = {};
const domainsOf = {};
const domainSold = {};
const planEndingTime = {};

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
  bot.sendMessage(chatId, 'Please enter the desired domain name:');
});

bot.onText(/Subscribe to plans/, msg => {
  const chatId = msg.chat.id;
  state[chatId].action = 'subscribe';
  bot.sendMessage(chatId, 'Choose a subscription plan:', {
    reply_markup: {
      keyboard: [['Daily'], ['Weekly'], ['Monthly']],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.onText(/See my subscribed plan/, msg => {
  const chatId = msg.chat.id;
  const subscribedPlan = state[chatId]?.subscription;

  if (subscribedPlan) {
    bot.sendMessage(
      chatId,
      `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
        planEndingTime[chatId],
      )}`,
    );
  } else {
    bot.sendMessage(chatId, 'You are not currently subscribed to any plan.');
  }
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
const timeOf = {
  Daily: 86400 * 1000,
  Weekly: 7 * 86400 * 1000,
  Monthly: 30 * 86400 * 1000,
};
bot.onText(/Daily|Weekly|Monthly/, (msg, match) => {
  const chatId = msg.chat.id;
  const plan = match[0];
  // Implement logic for handling subscription plans
  // For example, process payment and set subscription in the state
  planEndingTime[chatId] = Date.now() + timeOf[plan];
  state[chatId].subscription = plan;
  bot.sendMessage(
    chatId,
    `Payment successful! You are now subscribed to the ${plan} plan. Enjoy unlimited URL shortening with your purchased domain names.`,
    options,
  );
});

bot.on('message', msg => {
  const chatId = msg.chat.id;
  const message = msg.text;
  // if (!state[chatId]) state[chatId] = {};
  if (!state[chatId]) restoreData();

  const action = state[chatId]?.action;

  if (action === 'choose-domain') {
    const keyboard = [getPurchasedDomains(chatId)];
    bot.sendMessage(
      chatId,
      `Please choose the domain you want to link with your short link`,
      {
        reply_markup: {
          keyboard,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
    state[chatId].action = 'shorten';
    state[chatId].url = message;
  } else if (action === 'shorten') {
    // Implement logic to shorten the provided URL
    const domain = message;
    // delete state[chatId]?.selectedDomain;
    const shortenedURL = shortenURLAndSave(chatId, domain, state[chatId].url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`, options);
    delete state[chatId]?.url;
    delete state[chatId]?.action;
  } else if (action === 'buy') {
    // Implement logic to check domain availability and process purchase
    const domainPurchaseResult = buyDomain(chatId, message); // Stubbed function
    bot.sendMessage(chatId, domainPurchaseResult);
    delete state[chatId]?.action;
  } else if (action === 'subscribe') {
    // Handle cases where user sends unexpected messages during subscription process
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
  console.log(linksOf[chatId]);
  console.log(JSON.stringify(linksOf[chatId]));
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

function isNormalUser(chatId) {
  // Implement logic to determine if the user is a normal user
  // Return true if the user is a normal user, false otherwise
  return !isAdmin(chatId) && !isDeveloper(chatId);
}

// Stubbed function for demonstration purposes
function isDeveloper(chatId) {
  // Implement logic to determine if the user is a developer
  // Return true if the user is a developer, false otherwise
  return chatId === DEVELOPER_CHAT_ID; // Replace with the actual developer's chat ID
}
// Stubbed function for demonstration purposes
function isAdmin(chatId) {
  // Implement logic to determine if the user is the admin
  // Return true if the user is the admin, false otherwise
  return chatId === ADMIN_CHAT_ID; // Replace with the actual admin's chat ID
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
  console.log('Backup created.');
}

function buyDomain(chatId, domain) {
  if (domainSold[domain]) {
    return `Sorry, the domain name ${domain} is already taken.`;
  }
  domainSold[domain] = true;

  domainsOf[chatId] = domainsOf[chatId]
    ? domainsOf[chatId].concat(domain)
    : [domain];
  return (
    'Congratulations! You have successfully purchased the domain name ' + domain
  );
}

console.log('Bot is running...');
