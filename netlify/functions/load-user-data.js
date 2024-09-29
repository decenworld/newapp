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
  console.log('Received event:', event);
  
  const userId = event.queryStringParameters.userId;
  console.log('Attempting to load data for user:', userId);

  let conn;
  try {
    console.log('Attempting to connect to database...');
    conn = await pool.getConnection();
    console.log('Connected to database successfully');

    console.log('Executing query...');
    const rows = await conn.query('SELECT cookies_collected, buildings_data FROM user_game_data WHERE user_id = ?', [userId]);
    console.log('Query executed successfully');
    
    if (rows.length > 0) {
      const userData = {
        cookies: rows[0].cookies_collected,
        buildings: JSON.parse(rows[0].buildings_data)
      };
      console.log('User data found:', userData);
      return {
        statusCode: 200,
        body: JSON.stringify(userData)
      };
    } else {
      console.log('No data found for user:', userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No data found for user' })
      };
    }
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load user data', details: err.message })
    };
  } finally {
    if (conn) {
      console.log('Closing database connection');
      conn.release();
    }
  }
};
