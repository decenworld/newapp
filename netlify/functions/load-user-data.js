const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

exports.handler = async (event, context) => {
  const userId = event.queryStringParameters.userId;

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT cookies_collected, buildings_data, achievements FROM user_data WHERE user_id = ?', [userId]);
    
    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User data not found' }),
      };
    }

    const userData = rows[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        cookies_collected: userData.cookies_collected,
        buildings_data: JSON.parse(userData.buildings_data),
        achievements: JSON.parse(userData.achievements),
      }),
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load data', details: error.message }),
    };
  } finally {
    if (conn) conn.release();
  }
};
