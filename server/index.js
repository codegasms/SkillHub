const express = require('express');
const connectDB = require('./config/db');
const app = express();
const PORT = 3000;

const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

connectDB()
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, My lord!');
});

app.use('/user', userRoutes);
app.use('/review', reviewRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});