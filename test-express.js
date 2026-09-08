const express = require('express');
const app = express();
app.get('*all', (req, res) => res.send('matched ' + req.path));
app.listen(3001, () => {
  fetch('http://localhost:3001/').then(r => r.text()).then(console.log);
  fetch('http://localhost:3001/foo').then(r => r.text()).then(console.log);
  fetch('http://localhost:3001/*all').then(r => r.text()).then(console.log).then(() => process.exit(0));
});
