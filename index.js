const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;

  const startMenu = `
    👋 Welcome to the Escrow Bot!
    I'm here to assist you with secure transactions.

    Here are the available options:

    1. 💼 Create New Escrow
    2. 📊 View Existing Escrows
    3. 💸 Release Funds
    4. 🔙 Refund Funds
    5. 🛡️ Initiate Dispute
    6. 🕊️ Mediation Process
    7. ℹ️ Help & FAQs
    `;

  bot.sendMessage(chatId, startMenu);
});

bot.onText(/1/, msg => {
  // Simulate creating a new escrow
  const response =
    "You've initiated a new escrow. Please provide transaction details.";
  bot.sendMessage(msg.chat.id, response);
  // You can prompt for transaction details here
});

bot.onText(/2/, msg => {
  // Simulate viewing existing escrows
  const response =
    'Here are your existing escrows:\n1. Escrow #1\n2. Escrow #2';
  bot.sendMessage(msg.chat.id, response);
});

bot.onText(/3/, msg => {
  // Simulate releasing funds from an escrow
  const response = "You've released funds from escrow #1.";
  bot.sendMessage(msg.chat.id, response);
  // You can add logic to handle fund release here
});

bot.onText(/4/, msg => {
  // Simulate refunding funds back to sender
  const response = "You've initiated a refund for escrow #2.";
  bot.sendMessage(msg.chat.id, response);
  // You can add logic to handle refund here
});

bot.onText(/5/, msg => {
  // Simulate initiating a dispute
  const response = "You've initiated a dispute for escrow #3.";
  bot.sendMessage(msg.chat.id, response);
  // You can add logic to handle dispute initiation here
});

bot.onText(/6/, msg => {
  // Simulate starting mediation process
  const response = "You've started the mediation process for escrow #4.";
  bot.sendMessage(msg.chat.id, response);
  // You can add logic to handle mediation here
});

bot.onText(/7/, msg => {
  // Simulate accessing help and FAQs
  const response = 'Here is the help section:\n...';
  bot.sendMessage(msg.chat.id, response);
  // You can provide actual help and FAQs here
});

// Start the bot
console.log('Escrow Bot is running...');
