const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pool = require('../db'); // Make sure this exports the Pool correctly

// Connect once when cold-started
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('Error executing query', err.stack);
      } else {
        console.log('Connected to PostgreSQL database');
      }
    });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const roomRoutes = require('../routes/roomRoutes');
const paymentRoutes = require('../routes/paymentRoutes');

app.use('/rooms', roomRoutes);
app.use('/', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Union of Scientists in Bulgaria Hotel API');
});

// ✅ This is the required export for Vercel:
module.exports.handler = serverless(app);
