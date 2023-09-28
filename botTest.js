// let state = {};
// let escrows;
// function get(state, key) {
//   return state[key];
// }
// function set(state, key, value) {
//   state[key] = value;
// }
// function add(state, key, value) {
//   state[key] = value;
// }
// function del(state, key, value) {
//   state[key] = value;
// }

require('dotenv').config(); // Load environment variables from .env file

const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const token = process.env.TELEGRAM_BOT_TOKEN; // Access token from environment variable
let bot = new TelegramBot(token, { polling: true });

// DB State
let db;
const dbName = 'escrowBot';
let state;
let escrows;

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

async function get(c, key) {
  try {
    const result = await c.findOne({ _id: key });
    return result ? result : undefined;
  } catch (error) {
    console.error(`Error getting ${key} from ${c.collectionName}:`, error);
    return null;
  }
}

async function set(c, key, value) {
  try {
    await c.updateOne({ _id: key }, { $set: value }, { upsert: true });
    console.log(`${key} -> ${JSON.stringify(value)} set in ${c.collectionName}`);
  } catch (error) {
    console.error(`Error setting ${key} -> ${JSON.stringify(value)} in ${c.collectionName}:`, error);
  }
}

async function del(collection) {
  try {
    const result = await collection.deleteOne({ _id: chatId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting user state:', error);
    return false;
  }
}

async function add(collection, key, newValue) {
  try {
    const filter = { _id: key };
    const update = { $push: { ['list']: newValue } };

    const result = await collection.updateOne(filter, update, { upsert: true });

    if (result.modifiedCount === 1) {
      console.log(`Object added to array in document with _id: ${key}`);
    } else {
      console.log(`No document matched the filter or no changes were made.`);
    }
  } catch (error) {
    console.error(`Error adding object to array:`, error);
  }
}

bot.on('message', async msg => {
  if (!db) return;
  const chatId = '' + msg.chat.id;

  if (msg.text === '/start') {
    set(state, chatId, {}); // Initialize state for this user
    sendMessage(chatId, 'Welcome to Escrow Bot. Choose Option /CreateEscrow or /ViewEscrows');
  } else if (msg.text === '/CreateEscrow') {
    set(state, chatId, { step: 1 }); // Set step to 1 for CreateEscrow process
    sendMessage(chatId, 'Enter Escrow Name');
  } else if (msg.text === '/ViewEscrows') {
    const list = (await get(escrows, chatId))?.list;
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

bot.onText(/\/cancel/, async msg => {
  const chatId = msg.chat.id;

  const deleted = await del(chatId);

  if (deleted) {
    sendMessage(chatId, 'Process cancelled. Type /start to begin again.');
  } else {
    sendMessage(chatId, 'No active process to cancel. Type /start to begin.');
  }
});

function sendMessage(chatId, message) {
  bot.sendMessage(chatId, message);
}
