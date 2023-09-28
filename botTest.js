require('dotenv').config(); // Load environment variables from .env file

const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { get, set, add, del } = require('./dbTest.js');
const token = process.env.TELEGRAM_BOT_TOKEN; // Access token from environment variable
let bot = new TelegramBot(token, { polling: true });

let db;
let state;
let escrows;
const dbName = 'escrowBot';

const client = new MongoClient(process.env.MONGO_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

client
  .connect()
  .then(async () => {
    db = client.db(dbName);
    state = db.collection('state');
    escrows = db.collection('escrows');

    console.log('Connected');
  })
  .catch(err => console.log(err));

bot.on('message', async msg => {
  if (!db) return;
  const chatId = '' + msg.chat.id;

  if (msg.text === '/start') {
    set(state, chatId, {}); // Initialize state for this user
    sendMessage(chatId, 'Welcome to Escrow Bot. Choose Option /CreateEscrow or /ViewEscrows');
  } else if (msg.text === '/cancel') {
    const deleted = await del(state, chatId);

    if (deleted) {
      sendMessage(chatId, 'Process cancelled. Type /start to begin again.');
    } else {
      sendMessage(chatId, 'No active process to cancel. Type /start to begin.');
    }
  } else if (msg.text === '/CreateEscrow') {
    set(state, chatId, { step: 1 }); // Set step to 1 for CreateEscrow process
    sendMessage(chatId, 'Enter Escrow Name');
  } else if (msg.text === '/ViewEscrows') {
    const list = (await get(escrows, chatId))?.list || [];
    console.log('escrows', list);
    const escrowList = list.map(
      (escrow, index) =>
        `${index + 1}. Name: ${escrow.name}, Description: ${escrow.description}, Price: ${escrow.price}`,
    );
    const message = escrowList.join('\n');
    sendMessage(chatId, message || 'No escrows available.');
  } else {
    const step = (await get(state, chatId)).step;
    switch (step) {
      case 1:
        set(state, chatId, { ...(await get(state, chatId)), name: msg.text, step: 2 });
        sendMessage(chatId, 'Add Description or type /back to go back');
        break;

      case 2:
        if (msg.text === '/back') {
          sendMessage(chatId, 'Enter Escrow Name');
          set(state, chatId, { ...(await get(state, chatId)), step: 1 });
        } else {
          sendMessage(chatId, 'Add Price or type /back to go back');
          set(state, chatId, { ...(await get(state, chatId)), description: msg.text, step: 3 });
        }
        break;

      case 3:
        if (msg.text === '/back') {
          sendMessage(chatId, 'Add Description');
          set(state, chatId, { ...(await get(state, chatId)), step: 2 });
        } else {
          const { name, description } = await get(state, chatId);
          const newEscrow = { name, description, price: msg.text };
          add(escrows, chatId, newEscrow);
          set(state, chatId, { step: 0 }); // Reset step to 0
          sendMessage(chatId, 'Escrow Created Successfully!');
        }
        break;

      default:
        sendMessage(chatId, 'Invalid command.');
        break;
    }
  }
});

function sendMessage(chatId, message) {
  bot.sendMessage(chatId, message);
}
