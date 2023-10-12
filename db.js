// function get(table, key) {
//   return table[key];
// }
// function set(table, key, value) {
//   table[key] = value;
// }
// function del(table, key) {
//   if (!table[key]) return false;

//   delete table[key];
//   return true;
// }

const increment = async (c, key, val = 1) => {
  try {
    const count = (await get(c, key)) || 0;
    await set(c, key, count + val);
  } catch (error) {
    console.error(`Error db increment ${key} from ${c.collectionName}:`, error);
    return null;
  }
};

const decrement = async (c, key) => {
  try {
    const count = (await get(c, key)) || 0;
    await set(c, key, count - 1);
  } catch (error) {
    console.error(`Error db decrement ${key} from ${c.collectionName}:`, error);
    return null;
  }
};

async function get(c, key) {
  try {
    const result = await c.findOne({ _id: key });
    // console.log({ findIn: c.collectionName, key, result });
    if (result?.val === 0) return 0;

    return result?.val || result || undefined;
  } catch (error) {
    console.error(`Error db getting ${key} from ${c.collectionName}:`, error);
    return null;
  }
}

async function getAll(c) {
  try {
    const result = await c.find({}).toArray();
    return result;
  } catch (error) {
    console.error(`Error db getting all documents from ${c}:`, error);
    return null;
  }
}

// done these things to keep same way in changing db to memory variables (and memory variables back to db, easily)
async function set(c, key, value, valueInside) {
  try {
    if (!valueInside) {
      await c.updateOne({ _id: key }, { $set: { val: value } }, { upsert: true });
    } else {
      await c.updateOne({ _id: key }, { $set: { [value]: valueInside } }, { upsert: true });
    }

    // let a = JSON.stringify(valueInside);
    // a = a === undefined ? '' : ` ${a}`;
    // console.log(`${key}: ${JSON.stringify(value)}${a} set in ${c.collectionName}`);
  } catch (error) {
    console.error(`Error db setting ${key} -> ${JSON.stringify(value)} in ${c.collectionName}:`, error);
  }
}

async function del(c, chatId) {
  try {
    const result = await c.deleteOne({ _id: chatId });
    // console.log(`Deleted ${result.deletedCount >= 1 ? 'True' : 'False'} in ${c.collectionName} for ${chatId}`);
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error db deleting user state:', error);
    return false;
  }
}

module.exports = { increment, decrement, get, set, del, getAll };
