const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

exports.handler = async (event) => {
  const { userId } = event.queryStringParameters;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'userId is required' }),
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM user_data WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userData = rows[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        gameState: {
          cookies: userData.cookies_collected,
          buildings: JSON.parse(userData.buildings_data),
          // ... other game state properties
        },
        achievements: JSON.parse(userData.achievements),
      }),
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  } finally {
    if (conn) conn.release();
  }
};