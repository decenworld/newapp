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
        statusCode: 200,
        body: JSON.stringify({ gameState: null }),
      };
    }

    const userData = rows[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        gameState: {
          cookies_collected: userData.cookies_collected,
          buildings_data: userData.buildings_data,
          achievements: userData.achievements,
        },
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