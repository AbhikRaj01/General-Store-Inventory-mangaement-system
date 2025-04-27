const db = require('./db'); 

async function testConnection() {
  try {
    const res = await db.query('SELECT NOW() as current_time');
    console.log('Database connection successful:', res.rows[0].current_time);
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await db.end();
  }
}

testConnection();