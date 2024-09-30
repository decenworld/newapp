const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

exports.handler = async (event, context) => {
  console.log('Save function called');
  console.log('Event:', JSON.stringify(event));

  if (event.httpMethod !== 'POST') {
    console.error('Invalid HTTP method:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    console.log('Parsed data:', JSON.stringify(data));
  } catch (error) {
    console.error('Error parsing request body:', error);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body', details: error.message }) };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    console.error('Missing userId in request');
    return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  }

  console.log('Attempting to save data for userId:', userId);

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection established');

    const query = `
      INSERT INTO user_data (user_id, cookies_collected, buildings_data, achievements)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cookies_collected = VALUES(cookies_collected),
        buildings_data = VALUES(buildings_data),
        achievements = VALUES(achievements),
        last_updated = CURRENT_TIMESTAMP
    `;

    console.log('Executing query:', query);
    console.log('Query parameters:', [userId, cookies_collected, buildings_data, achievements]);

    const result = await conn.query(query, [userId, cookies_collected, buildings_data, achievements]);
    console.log('Query result:', JSON.stringify(result));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully', result }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to save data', 
        details: error.message, 
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        code: error.code
      })
    };
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
};