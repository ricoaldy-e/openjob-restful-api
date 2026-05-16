require('dotenv').config();

const fs = require('fs');
const path = require('path');
const app = require('./app');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
