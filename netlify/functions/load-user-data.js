const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  acquireTimeout: 30000, // Increase timeout to 30 seconds
  connectTimeout: 30000, // Increase timeout to 30 seconds
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const executeWithRetry = async (operation, retries = MAX_RETRIES) => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error.code === 'ER_GET_CONNECTION_TIMEOUT' || error.code === 'ECONNREFUSED')) {
      console.log(`Retrying operation. Attempts left: ${retries - 1}`);
      await wait(RETRY_DELAY);
      return executeWithRetry(operation, retries - 1);
    }
    throw error;
  }
};

exports.handler = async (event, context) => {
  const userId = event.queryStringParameters.userId;

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  }

  let conn;
  try {
    conn = await executeWithRetry(() => pool.getConnection());
    console.log('Database connection established');

    const [user] = await executeWithRetry(() => 
      conn.query('SELECT * FROM user_data WHERE user_id = ?', [userId])
    );
    
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Convert BigInt to Number for JSON serialization
    const safeUser = {
      ...user,
      cookies_collected: Number(user.cookies_collected)
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        cookies_collected: safeUser.cookies_collected,
        buildings_data: JSON.parse(safeUser.buildings_data),
        achievements: JSON.parse(safeUser.achievements),
      }),
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load data', details: error.message })
    };
  } finally {
    if (conn) await conn.release();
  }
};