const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const { pool } = require('../db'); // Adjust path if needed

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

app.use('/api/rooms', roomRoutes);
app.use('/api', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send("'Welcome to the Union of Scientists in Bulgaria Hotel API'")
});

// Export wrapped Express app for Vercel
module.exports = serverless(app);
