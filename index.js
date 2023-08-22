const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const shortid = require('shortid'); // Assuming you have this module installed

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST;

const uri = `mongodb+srv://${username}:${password}@${host}/?retryWrites=true&w=majority`;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const dbName = 'link_shortener';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function start() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    bot.onText(/\/start/, msg => {
      const chatId = msg.chat.id;
      const greetings =
        `Hello there! I'm your link-shortening bot. Here are the commands you can use:\n\n` +
        `/start - Get a friendly greeting and command list\n` +
        `/shorten [url] - Shorten a URL\n` +
        `/mylinks - View your shortened links`;

      bot.sendMessage(chatId, greetings);
    });

    bot.onText(/\/shorten (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const originalUrl = match[1];

      // Generate short URL logic
      const shortUrl = shortid.generate();

      // Store original and short URLs in MongoDB
      await db.collection('short_links').insertOne({
        chatId,
        originalUrl,
        shortUrl,
      });

      bot.sendMessage(chatId, `Shortened URL: ${shortUrl}`);
    });

    bot.onText(/\/mylinks/, async msg => {
      const chatId = msg.chat.id;

      const userLinks = await db
        .collection('short_links')
        .find({ chatId })
        .toArray();

      if (userLinks.length === 0) {
        bot.sendMessage(chatId, 'No shortened links found.');
        return;
      }

      let response = 'Your shortened links:\n';
      userLinks.forEach(link => {
        response += `${link.originalUrl} -> ${link.shortUrl}\n`;
      });

      bot.sendMessage(chatId, response);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

start(); // Start the server after connecting to MongoDB and setting up bot commands
