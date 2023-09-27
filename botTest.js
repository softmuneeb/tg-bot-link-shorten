// let state = {};
// let escrows;
// function get(state, key) {
//   return state[key];
// }
// function set(state, key, value) {
//   state[key] = value;
// }

require('dotenv').config(); // Load environment variables from .env file

const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const token = process.env.TELEGRAM_BOT_TOKEN; // Access token from environment variable
let bot = new TelegramBot(token, { polling: true });

let db;
const dbName = 'escrowBot';
const host = process.env.MONGO_HOST;
const password = process.env.MONGO_PASSWORD;
const username = process.env.MONGO_USERNAME;

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
    // await client.db('admin').command({ ping: 1 });
    console.log('Connected');

    // array language of mongo db
    // addObjectToArray('linkoosOf', 'chat1', { 1: 2, a: { 3: 4 } });
    // console.log(JSON.stringify(await get('linkoosOf', 'chat1'), null, 2));

    // await set('state', '3340', { a: 1 }); // Initialize state for this user
    // const bb = await get('state', '3340'); // Initialize state for this user
    // console.log('hi ', bb);
  })
  .catch(err => console.log(err));

async function getAll(collectionName) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.find({}).toArray();
    return result;
  } catch (error) {
    console.error(`Error getting all documents from ${collectionName}:`, error);
    return null;
  }
}

async function get(collectionName, key) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.findOne({ _id: key });
    return result ? result : undefined;
  } catch (error) {
    console.error(`Error getting ${key} from ${collectionName}:`, error);
    return null;
  }
}

async function set(collectionName, key, value) {
  try {
    const collection = db.collection(collectionName);
    //   collection.insertOne({ _id: key, [key]: value });
    await collection.updateOne({ _id: key }, { $set: value }, { upsert: true });
    console.log(`${key} -> ${JSON.stringify(value)} set in ${collectionName}`);
  } catch (error) {
    console.error(`Error setting ${key} in ${collectionName}:`, error);
  }
}

async function deleteUserState(chatId) {
  try {
    const collection = db.collection('state'); // Assuming 'state' is the collection name
    const result = await collection.deleteOne({ _id: chatId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting user state:', error);
    return false;
  }
}

async function addObjectToArray(collectionName, key, newValue) {
  try {
    const collection = db.collection(collectionName);
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
    await set('state', chatId, {}); // Initialize state for this user
    sendMessage(chatId, 'Welcome to Escrow Bot. Choose Option /CreateEscrow or /ViewEscrows');
  } else if (msg.text === '/CreateEscrow') {
    await set('state', chatId, { step: 1 }); // Set step to 1 for CreateEscrow process
    sendMessage(chatId, 'Enter Escrow Name');
  } else if (msg.text === '/ViewEscrows') {
    const escrows = (await get('escrows', chatId))?.list;
    console.log('escrows', escrows);
    const escrowList = escrows.map(
      (escrow, index) =>
        `${index + 1}. Name: ${escrow.name}, Description: ${escrow.description}, Price: ${escrow.price}`,
    );
    const message = escrowList.join('\n');
    sendMessage(chatId, message || 'No escrows available.');
  } else {
    const step = (await get('state', chatId)).step;
    // console.log('step ', step);
    switch (step) {
      case 1:
        await set('state', chatId, { ...(await get('state', chatId)), name: msg.text, step: 2 });
        sendMessage(chatId, 'Add Description or type /back to go back');
        break;

      case 2:
        if (msg.text === '/back') {
          await set('state', chatId, { ...(await get('state', chatId)), step: 1 });
          sendMessage(chatId, 'Enter Escrow Name');
        } else {
          await set('state', chatId, { ...(await get('state', chatId)), description: msg.text, step: 3 });
          sendMessage(chatId, 'Add Price or type /back to go back');
        }
        break;

      case 3:
        if (msg.text === '/back') {
          await set('state', chatId, { ...(await get('state', chatId)), step: 2 });
          sendMessage(chatId, 'Add Description');
        } else {
          await set('state', chatId, { ...(await get('state', chatId)), price: msg.text });
          const name = (await get('state', chatId))?.name;
          const description = (await get('state', chatId))?.description;
          const price = (await get('state', chatId))?.price;
          const newEscrow = { name, description, price };
          await addObjectToArray('escrows', chatId, newEscrow);
          await set('state', chatId, { step: 0 }); // Reset step to 0
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

  const deleted = await deleteUserState(chatId);

  if (deleted) {
    await sendMessage(chatId, 'Process cancelled. Type /start to begin again.');
  } else {
    await sendMessage(chatId, 'No active process to cancel. Type /start to begin.');
  }
});

function sendMessage(chatId, message) {
  bot.sendMessage(chatId, message);
}
