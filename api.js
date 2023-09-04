const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});

app.get('/save-payment-blockbee', (req, res) => {
  console.log('Received payment data:', req.originalUrl);
  // Here you can save the payment information to your database or perform any other necessary actions.
  // bot send message: You payment is successful now you can buy domains and shorten links
  console.log(JSON.stringify(req.params, null, 2));
  res.json({ message: 'Payment data received and processed successfully' });
});

const startServer = () => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

module.exports = {
  startServer,
};
