const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const options = {
  reply_markup: {
    keyboard: [
      ['Shorten a URL'],
      ['See my shortened links'],
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

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  state[chatId] = {};
  bot.sendMessage(
    chatId,
    'Welcome to the URL Shortener Bot! Please select an option:',
    options,
  );
});

bot.onText(/Shorten a URL/, msg => {
  const chatId = msg.chat.id;
  state[chatId].action = 'shorten';
  bot.sendMessage(chatId, 'Please provide the URL you want to shorten:');
});

bot.onText(/Buy a domain name/, msg => {
  const chatId = msg.chat.id;
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
      `You are currently subscribed to the ${subscribedPlan} plan. Enjoy unlimited URL shortening with your purchased domain names.`,
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

bot.onText(/Daily|Weekly|Monthly/, (msg, match) => {
  const chatId = msg.chat.id;
  const plan = match[0];
  // Implement logic for handling subscription plans
  // For example, process payment and set subscription in the state
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
  const action = state[chatId]?.action;

  if (action === 'shorten') {
    // Implement logic to shorten the provided URL
    const shortenedURL = shortenURL(message); // Stubbed function
    bot.sendMessage(chatId, `Your shortened URL is: ${shortenedURL}`);
    delete state[chatId]?.action;
  } else if (action === 'buy') {
    // Implement logic to check domain availability and process purchase
    const domainPurchaseResult = buyDomain(chatId, message); // Stubbed function
    bot.sendMessage(chatId, domainPurchaseResult);
    delete state[chatId]?.action;
  } else if (action === 'subscribe') {
    // Handle cases where user sends unexpected messages during subscription process
    delete state[chatId]?.action;
  }
  // else {
  //   bot.sendMessage(chatId, "I'm sorry, I didn't understand that command.");
  // }
});

// Stubbed functions for demonstration purposes
function getShortenedLinks(chatId) {
  return ['jamesten.com/hnbsGud']; // Replace with actual logic
}

function getPurchasedDomains(chatId) {
  return ['jamesten.com']; // Replace with actual logic
}

function shortenURL(url) {
  return 'SHORTENED_URL'; // Replace with actual logic
}

function buyDomain(chatId, domain) {
  if (domain === 'jamesten.com') {
    return 'Sorry, the domain name jamesten.com is already taken.';
  }
  // Implement logic to process domain purchase
  return (
    'Congratulations! You have successfully purchased the domain name ' + domain
  );
}

console.log('Bot is running...');
