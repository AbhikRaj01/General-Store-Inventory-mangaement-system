const db = require('./db');

async function getProducts() {
  try {
    const { rows } = await db.query('SELECT * FROM product');
    console.log('Products:', rows);
    return rows;
  } catch (err) {
    console.error('Error fetching products:', err);
    throw err;
  }
}

// Example usage
getProducts()
  .then(() => db.end()) // Close connection when done
  .catch(err => console.error('Error:', err));