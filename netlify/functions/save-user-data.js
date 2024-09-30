const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  acquireTimeout: 30000,
  connectTimeout: 30000,
});

exports.handler = async (event, context) => {
  console.log('Save function called');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    console.error('Missing userId in request');
    return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  }

  console.log('Attempting to save data for userId:', userId);

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection established');

    const [existingUser] = await conn.query('SELECT 1 FROM user_data WHERE user_id = ?', [userId]);
    
    if (existingUser && existingUser.length > 0) {
      await conn.query(
        'UPDATE user_data SET cookies_collected = ?, buildings_data = ?, achievements = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?',
        [cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements), userId]
      );
      console.log('User data updated');
    } else {
      await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?)',
        [userId, cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements)]
      );
      console.log('New user data inserted');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message, stack: error.stack })
    };
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
};