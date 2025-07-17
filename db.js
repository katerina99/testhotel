// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'kioann12',
  host: 'database-1.crykwk22g7ax.eu-north-1.rds.amazonaws.com',
  database: 'hoteldatabase',
  password: '1056139Katerin',
  port: 5432, // or your actual port
  ssl: {
    rejectUnauthorized: false // Required for RDS connections
  }
});

module.exports = pool;
