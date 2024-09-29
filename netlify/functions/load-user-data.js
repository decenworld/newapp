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
  console.log('Received event:', event);
  
  const userId = event.queryStringParameters.userId;
  console.log('Attempting to load data for user:', userId);

  let conn;
  try {
    console.log('Attempting to connect to database...');
    conn = await pool.getConnection();
    console.log('Connected to database successfully');

    // Check if user exists
    const userExists = await conn.query('SELECT 1 FROM user_data WHERE user_id = ?', [userId]);
    
    if (userExists.length === 0) {
      console.log('User does not exist. Creating new user data.');
      // Insert new user with default values
      await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, last_updated) VALUES (?, ?, ?, NOW())',
        [userId, 0, JSON.stringify({})]
      );
      console.log('New user data created successfully');
    }

    console.log('Executing query to fetch user data...');
    const rows = await conn.query('SELECT cookies_collected, buildings_data FROM user_data WHERE user_id = ?', [userId]);
    console.log('Query executed successfully');
    
    if (rows.length > 0) {
      const userData = {
        cookies: rows[0].cookies_collected,
        buildings: JSON.parse(rows[0].buildings_data)
      };
      console.log('User data found:', userData);
      return {
        statusCode: 200,
        body: JSON.stringify(userData)
      };
    } else {
      console.log('No data found for user:', userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No data found for user' })
      };
    }
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load user data', details: err.message })
    };
  } finally {
    if (conn) {
      console.log('Closing database connection');
      conn.release();
    }
  }
};
