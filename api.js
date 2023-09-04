const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Assalamo Alaikum', from: req.hostname });
});

app.post('/save-payment-blockbee', (req, res) => {
  console.log('Full URL:', req.originalUrl);
  console.log('Received payment data:', req.body);
  // Here you can save the payment information to your database or perform any other necessary actions.
  console.log(JSON.stringify(req.body, null, 2));
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
