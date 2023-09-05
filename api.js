const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();

app.use(cors());

app.set('json spaces', 2);

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

app.get('/get-json-data', (req, res) => {
  fs.readFile('backup.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  }); 
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
