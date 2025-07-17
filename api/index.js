// const serverless = require('serverless-http');
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const pool = require('../db'); // your Pool instance

// // Import routes
// const roomRoutes = require('../routes/roomRoutes');
// const paymentRoutes = require('../routes/paymentRoutes');

// // Connect once at cold start (optional)
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('Error acquiring client', err.stack);
//   } else {
//     client.query('SELECT NOW()', (err, result) => {
//       release();
//       if (err) {
//         console.error('Error executing query', err.stack);
//       } else {
//         console.log('Connected to PostgreSQL database');
//       }
//     });
//   }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes — no /api prefix needed here, Vercel handles that
// app.use('/rooms', roomRoutes);
// // app.use('/', paymentRoutes);

// // Basic route at /api/
// app.get('/', (req, res) => {
//   res.send('Welcome to the Union of Scientists in Bulgaria Hotel API');
// });

// // Export ONLY the handler for Vercel serverless function
// module.exports = serverless(app);

const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const testRoutes = require('../controllers/testController');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.use('/test', testRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('API is up and running!');
});

module.exports = serverless(app);
