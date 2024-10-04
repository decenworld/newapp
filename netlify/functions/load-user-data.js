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
  console.log('Load function called for userId:', userId);

  if (!userId) {
    console.log('No userId provided');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'userId is required' }),
    };
  }

  // For the fallback user, return an empty response
  if (userId === 'browser-test-user') {
    console.log('Fallback user detected, returning empty response');
    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: null }),
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection established');
    const rows = await conn.query('SELECT * FROM user_data WHERE user_id = ?', [userId]);
    console.log('Query executed, rows returned:', rows.length);

    if (rows.length === 0) {
      console.log('No data found for userId:', userId);
      return {
        statusCode: 200,
        body: JSON.stringify({ gameState: null }),
      };
    }

    const userData = rows[0];
    console.log('User data found:', JSON.stringify(userData));
    return {
      statusCode: 200,
      body: JSON.stringify({
        gameState: {
          cookies_collected: userData.cookies_collected,
          buildings_data: userData.buildings_data,
          achievements: userData.achievements,
          upgrades: userData.upgrades,
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
    if (conn) {
      await conn.release();
      console.log('Database connection released');
    }
  }
};