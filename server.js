const express = require('express');

const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;
const pool = require('./db');

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to PostgreSQL database');
  });
});


// Middleware
app.use(cors());
app.use(express.json());


// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to PostgreSQL database');
  });
});

// Import routes
const roomRoutes = require('./routes/roomRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// Use routes
app.use('/api/rooms', roomRoutes);
// app.use('/api', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Union of Scientists in Bulgaria Hotel API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export pool for use in controllers
module.exports = { pool };