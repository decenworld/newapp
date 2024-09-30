const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 20000,  // Increased to 20 seconds
  acquireTimeout: 20000,  // Increased to 20 seconds
  idleTimeout: 60000,     // Added idle timeout
  multipleStatements: true,
  trace: true,            // Enable tracing for debugging
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'userId is required' })
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection established');

    const [existingUser] = await conn.query('SELECT 1 FROM user_data WHERE user_id = ?', [userId]);
    
    let result;
    if (existingUser && existingUser.length > 0) {
      result = await conn.query(
        'UPDATE user_data SET cookies_collected = ?, buildings_data = ?, achievements = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?',
        [cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements), userId]
      );
    } else {
      result = await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?)',
        [userId, cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements)]
      );
    }

    console.log('Save operation result:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: existingUser && existingUser.length > 0 ? 'Data updated successfully' : 'New user created and data saved',
        result 
      }),
    };
  } catch (error) {
    console.error('Error details:', error);
    if (error.code === 'ER_GET_CONNECTION_TIMEOUT' || error.code === 'ER_CONNECTION_TIMEOUT') {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'Database connection timeout. Please try again later.' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message, code: error.code })
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
};
