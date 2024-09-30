const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, cookies_collected, buildings_data, achievements } = JSON.parse(event.body);

  try {
    const connection = await pool.getConnection();

    await connection.query(
      'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE cookies_collected = ?, buildings_data = ?, achievements = ?',
      [userId, cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements), cookies_collected, JSON.stringify(buildings_data), JSON.stringify(achievements)]
    );

    connection.release();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data' }),
    };
  }
};
