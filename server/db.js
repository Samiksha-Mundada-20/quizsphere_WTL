// db.js - creates ONE shared pool of MySQL connections.
// Every route file does: const pool = require('../db');
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz_system',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true // return DECIMAL columns (percentage, AVG) as numbers, not strings
});

module.exports = pool;
