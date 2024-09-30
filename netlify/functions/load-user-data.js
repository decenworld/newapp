const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 30000,  // Increased to 30 seconds
  acquireTimeout: 30000,  // Increased to 30 seconds
  idleTimeout: 60000,
  multipleStatements: true,
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
    console.log('Database connection established');

    // Check if user exists
    const [existingUser] = await conn.query('SELECT * FROM user_data WHERE user_id = ?', [userId]);
    
    if (!existingUser || existingUser.length === 0) {
      // Create new user with default state
      await conn.query(
        'INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements) VALUES (?, ?, ?, ?)',
        [userId, defaultGameState.cookies_collected, JSON.stringify(defaultGameState.buildings_data), JSON.stringify(defaultGameState.achievements)]
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...defaultGameState,
          newUser: true
        }),
      };
    }

    // Return existing user data
    return {
      statusCode: 200,
      body: JSON.stringify({
        cookies_collected: existingUser.cookies_collected,
        buildings_data: JSON.parse(existingUser.buildings_data),
        achievements: JSON.parse(existingUser.achievements),
        newUser: false
      }),
    };
  } catch (error) {
    console.error('Error details:', error);
    if (error.code === 'ER_GET_CONNECTION_TIMEOUT' || error.code === 'ER_CONNECTION_TIMEOUT') {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: 'Database connection timeout. Please try again later.' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load data', details: error.message, code: error.code })
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
};