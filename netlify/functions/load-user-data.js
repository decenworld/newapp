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
  const userId = event.queryStringParameters.userId;

  try {
    const connection = await pool.getConnection();

    const [userData] = await connection.query(
      'SELECT cookies_collected, buildings_data, achievements FROM user_data WHERE user_id = ?',
      [userId]
    );

    connection.release();

    if (userData.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        cookies_collected: userData[0].cookies_collected,
        buildings_data: JSON.parse(userData[0].buildings_data),
        achievements: JSON.parse(userData[0].achievements),
      }),
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load data' }),
    };
  }
};
