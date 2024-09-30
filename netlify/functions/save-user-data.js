const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

exports.handler = async (event, context) => {
  console.log('Save function called');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: 'Invalid JSON in request body' };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    return { statusCode: 400, body: 'userId is required' };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cookies_collected = VALUES(cookies_collected),
        buildings_data = VALUES(buildings_data),
        achievements = VALUES(achievements),
        last_updated = CURRENT_TIMESTAMP
    `;

    const result = await conn.query(query, [userId, cookies_collected, buildings_data, achievements]);
    console.log('Save result:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message }),
    };
  } finally {
    if (conn) await conn.release();
  }
};