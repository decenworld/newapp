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
  let conn;
  try {
    conn = await connectWithRetry();
    console.log('Connected to database successfully');
    // ... rest of your function code ...
  } catch (err) {
    console.error('Database error after retries:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect to database after multiple attempts', details: err.message })
    };
  } finally {
    if (conn) conn.release();
  }
};
