const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000, // 10 seconds
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, cookies_collected, buildings_data, achievements } = JSON.parse(event.body);

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await conn.query('SELECT 1 FROM user_data WHERE user_id = ?', [userId]);
    
    let result;
    if (existingUser && existingUser.length > 0) {
      // Update existing user
      result = await conn.query(
        'UPDATE user_data SET cookies_collected = ?, buildings_data = ?, achievements = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?',
        [cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements), userId]
      );
    } else {
      // Create new user
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
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message, code: error.code }),
    };
  } finally {
    if (conn) conn.release();
  }
};
