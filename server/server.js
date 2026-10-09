// server.js - starts the Express server and connects all the route files.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { errorHandler } = require('./middleware/errors');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));  // allow the React app
app.use(express.json());                                                       // read JSON request bodies

app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'Quiz API running' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Quiz API running at http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected.');
    // Ensure max_attempts column exists
    await pool.query('ALTER TABLE quizzes ADD COLUMN max_attempts INT NOT NULL DEFAULT 0').catch(() => {});
  } catch (err) {
    console.log('MySQL NOT connected yet: ' + err.message);
    console.log('The server is running, but login and quizzes will not work until the database is set up.');
  }
});
