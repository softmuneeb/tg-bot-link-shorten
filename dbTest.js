// function get(table, key) {
//   return table[key];
// }
// function set(table, key, value) {
//   table[key] = value;
// }
// function add(table, key, value) {
//   if (!table[key]) {
//     table[key] = {};
//     table[key]['list'] = [];
//   }
//   table[key]['list'].push(value);
// }
// function del(table, key) {
//   if (!table[key]) return false;

//   delete table[key];
//   return true;
// }

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

async function del(collection, chatId) {
  try {
    const result = await collection.deleteOne({ _id: chatId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting user state:', error);
    return false;
  }
}

module.exports = { get, set, add, del };
