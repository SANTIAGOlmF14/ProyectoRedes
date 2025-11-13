const express = require('express');
const cors = require('cors');
const usersController = require('./src/controllers/usersController');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', usersController);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Identity Service corriendo en http://localhost:${PORT}`);
});

