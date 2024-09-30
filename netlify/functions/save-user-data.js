const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  }

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
    } else {
      await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?)',
        [userId, cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements)]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message })
    };
  } finally {
    if (conn) await conn.end();
  }
};