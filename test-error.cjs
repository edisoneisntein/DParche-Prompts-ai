const express = require('express');
const app = express();
app.get('*all', (req, res) => res.sendFile('/does/not/exist'));
app.listen(3003, () => {
  fetch('http://localhost:3003/').then(r => r.text()).then(console.log).then(() => process.exit(0));
});
