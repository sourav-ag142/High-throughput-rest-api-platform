require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX || 10)
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database schema and sample data are ready.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exitCode = 1;
});
