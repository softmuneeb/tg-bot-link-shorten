const axios = require('axios');

const accessToken = '70b8b660832de7d3e8f7d151eb6e5dc5d82f4662';
const bitlyApiUrl = 'https://api-ssl.bitly.com/v4/shorten';

const createShortBitly = async (longUrl) => {
  try {
    const response = await axios.post(
      bitlyApiUrl,
      {
        long_url: longUrl,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const shortUrl = response.data.id;
    console.log('Short URL:', shortUrl);
    return shortUrl;
  } catch (error) {
    console.error('Error creating short URL:', error.response.data);
    throw error;
  }
};

module.exports = createShortBitly;

