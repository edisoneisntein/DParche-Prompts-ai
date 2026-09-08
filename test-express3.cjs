const express = require('express');
const app = express();
try {
  app.get('*all', (req, res) => res.send('ok'));
  console.log('Success');
} catch (e) {
  console.log('Error:', e.message);
}
