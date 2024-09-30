const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST, // Your public IP or domain
  port: process.env.DB_PORT, // 33070
  user: process.env.DB_USER, // 'steffan'
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 30000,
  acquireTimeout: 30000
});

async function createTableIfNotExists(conn) {
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id VARCHAR(255) PRIMARY KEY,
        cookies_collected INT DEFAULT 0,
        buildings_data JSON,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table user_data created or already exists');
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(retries = MAX_RETRIES) {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to database successfully');
    return conn;
  } catch (err) {
    if (retries > 0) {
      console.log(`Connection failed. Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    } else {
      throw err;
    }
  }
}

exports.handler = async (event, context) => {
  const userId = event.queryStringParameters.userId;

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT cookies_collected, buildings_data FROM user_data WHERE user_id = ?', [userId]);
    
    if (rows.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          cookies_collected: rows[0].cookies_collected,
          buildings_data: rows[0].buildings_data
        })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User data not found' })
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load user data' })
    };
  } finally {
    if (conn) conn.release();
  }
};
