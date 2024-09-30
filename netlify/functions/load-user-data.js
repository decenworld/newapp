const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 10000,
  acquireTimeout: 10000,
});

const defaultGameState = {
  cookies_collected: 0,
  buildings_data: [
    { name: "Cursor", baseCost: 15, baseCps: 0.1, count: 0 },
    { name: "Grandma", baseCost: 100, baseCps: 1, count: 0 },
    { name: "Farm", baseCost: 1100, baseCps: 8, count: 0 },
    { name: "Mine", baseCost: 12000, baseCps: 47, count: 0 },
    { name: "Factory", baseCost: 130000, baseCps: 260, count: 0 },
  ],
  achievements: []
};

exports.handler = async (event, context) => {
  const userId = event.queryStringParameters.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'userId is required' })
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT cookies_collected, buildings_data, achievements FROM user_data WHERE user_id = ?', [userId]);
    
    if (rows.length === 0) {
      // Create default data for new user
      await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?)',
        [userId, defaultGameState.cookies_collected, JSON.stringify(defaultGameState.buildings_data), JSON.stringify(defaultGameState.achievements)]
      );
      return {
        statusCode: 200,
        body: JSON.stringify(defaultGameState),
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
      body: JSON.stringify({ error: 'Failed to load data', details: error.message, stack: error.stack })
    };
  } finally {
    if (conn) conn.release();
  }
};
