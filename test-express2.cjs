const express = require('express');
const app = express();
app.get('*all', (req, res) => res.send('matched ' + req.path));
app.listen(3002, () => {
  fetch('http://localhost:3002/').then(r => r.text()).then(console.log).then(() => process.exit(0));
});
