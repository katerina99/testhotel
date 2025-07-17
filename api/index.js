const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pool = require('../db'); // your Pool instance

// Connect once at cold start (optional, you can remove this block if problematic)
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

// Routes — NOTE: remove '/api' prefix here!
// Vercel mounts this entire app at /api automatically,
// so your routes here should be relative to /api root.
app.use('/rooms', roomRoutes);
app.use('/', paymentRoutes);

// Basic route at /api/
app.get('/', (req, res) => {
  res.send('Welcome to the Union of Scientists in Bulgaria Hotel API');
});

// Export ONLY the handler for Vercel serverless function
module.exports = serverless(app);
