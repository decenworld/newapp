const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, gameState } = JSON.parse(event.body);
  console.log('Attempting to save data for user:', userId);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO user_game_data (user_id, cookies_collected, buildings_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cookies_collected = ?, buildings_data = ?',
      [userId, gameState.cookies, JSON.stringify(gameState.buildings), gameState.cookies, JSON.stringify(gameState.buildings)]
    );
    
    console.log('Data saved successfully for user:', userId);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' })
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save user data' })
    };
  } finally {
    if (conn) conn.release();
  }
};
