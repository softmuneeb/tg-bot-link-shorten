function getAnalyticsData(clicksOf) {
  let res = `Total short links: ${totalShortLinks}\n`;
  for (const key in clicksOf) {
    res += `Clicks in ${key}: ${clicksOf[key]}\n`;
  }
  return res;
}

const increment = async (c, key) => {
  try {
    const count = ((await get(c, key)) || 0) + 1;
    await set(c, key, count);
  } catch (error) {
    console.error(`Error increment ${key} from ${c.collectionName}:`, error);
    return null;
  }
};

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

async function get(c, key) {
  try {
    const result = await c.findOne({ _id: key });
    // console.log({ findIn: c.collectionName, key, result });
    return result?.val || result || undefined;
  } catch (error) {
    console.error(`Error getting ${key} from ${c.collectionName}:`, error);
    return null;
  }
}

async function getAll(c) {
  try {
    const result = await c.find({}).toArray();
    return result;
  } catch (error) {
    console.error(`Error getting all documents from ${c}:`, error);
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

    let a = JSON.stringify(valueInside);
    a = a === undefined ? '' : ` ${a}`;
    // console.log(`${key}: ${JSON.stringify(value)}${a} set in ${c.collectionName}`);
  } catch (error) {
    console.error(`Error setting ${key} -> ${JSON.stringify(value)} in ${c.collectionName}:`, error);
  }
}

async function del(c, chatId) {
  try {
    const result = await c.deleteOne({ _id: chatId });
    // console.log(`Deleted ${result.deletedCount >= 1 ? 'True' : 'False'} in ${c.collectionName} for ${chatId}`);
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting user state:', error);
    return false;
  }
}

module.exports = { getAnalyticsData, increment, get, set, del, getAll };
