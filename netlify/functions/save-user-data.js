const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, cookies_collected, buildings_data, achievements } = JSON.parse(event.body);

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE cookies_collected = ?, buildings_data = ?, achievements = ?, last_updated = CURRENT_TIMESTAMP',
      [userId, cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements), cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements)]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully', result }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message }),
    };
  } finally {
    if (conn) conn.release();
  }
};
