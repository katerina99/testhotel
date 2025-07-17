require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    console.log('Testing Amazon RDS connection...');
    console.log('Host:', process.env.PG_HOST);
    console.log('Database:', process.env.PG_DATABASE);
    console.log('User:', process.env.PG_USER);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].db_version);
    
    // Test if your hotel tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Available tables:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Common issues:');
    console.error('- Check your .env file values');
    console.error('- Verify RDS security group allows port 5432');
    console.error('- Ensure RDS instance is publicly accessible (if connecting from outside VPC)');
    console.error('- Check if password is correct');
  } finally {
    await pool.end();
  }
}

testConnection();