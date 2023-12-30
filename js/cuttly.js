const axios = require('axios');
const apiKey = 'ea4192935d1fd646f55e3775924db52dbeac8';

const createShortUrlCuttly = async (longUrl) => {
  const cuttlyApiUrl = `https://cutt.ly/api/api.php?key=${apiKey}&short=${encodeURIComponent(longUrl)}`;

  try {
    const response = await axios.get(cuttlyApiUrl);
    const { status, shortLink } = response.data.url;

    if (status === 7) {
      console.log('Short URL:', shortLink);
      return shortLink;
    } else {
      console.error('Error creating short URL:', response.data.url.msg);
    }
  } catch (error) {
    console.error('Error creating short URL:', error.message);
  }
};

// Usage

module.exports = createShortUrlCuttly;
