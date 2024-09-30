const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  connectTimeout: 30000,
  acquireTimeout: 30000
});

async function createTableIfNotExists(conn) {
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id VARCHAR(255) PRIMARY KEY,
        cookies_collected INT DEFAULT 0,
        buildings_data JSON,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table user_data created or already exists');
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  }
}

exports.handler = async (event, context) => {
  console.log('Received event:', event);
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, cookies, buildings } = JSON.parse(event.body);
  console.log('Attempting to save data for user:', userId);

  let conn;
  try {
    console.log('Attempting to connect to database...');
    conn = await pool.getConnection();
    console.log('Connected to database successfully');

    await createTableIfNotExists(conn);

    console.log('Executing query to save user data...');
    await conn.query(
      'INSERT INTO user_data (user_id, cookies_collected, buildings_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cookies_collected = ?, buildings_data = ?',
      [userId, cookies, JSON.stringify(buildings), cookies, JSON.stringify(buildings)]
    );
    console.log('User data saved successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully' })
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save user data', details: err.message })
    };
  } finally {
    if (conn) {
      console.log('Closing database connection');
      conn.release();
    }
  }
};
