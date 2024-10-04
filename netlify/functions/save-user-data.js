const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

// Helper function to recursively convert BigInt to Number
const convertBigIntToNumber = (obj) => {
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigIntToNumber(value)])
    );
  }
  return obj;
};

exports.handler = async (event, context) => {
  console.log('Save function called at:', new Date().toISOString());

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    data = convertBigIntToNumber(data);
    console.log('Parsed and converted data:', JSON.stringify(data));
  } catch (error) {
    console.error('Error parsing request body:', error);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
  }

  const { userId, cookies_collected, buildings_data, achievements } = data;

  if (!userId) {
    console.error('Missing userId in request');
    return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
  }

  // For the fallback user, return a success response without saving to the database
  if (userId === 'browser-test-user') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully (fallback user)' }),
    };
  }

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
    const safeResult = convertBigIntToNumber(result);
    console.log('Save result:', JSON.stringify(safeResult));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully', result: safeResult }),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message }),
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