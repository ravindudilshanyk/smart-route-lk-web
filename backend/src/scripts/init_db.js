const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  try {
    const sqlPath = path.resolve(__dirname, '../../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Database initialized');
    process.exit(0);
  } catch (err) {
    console.error('DB init failed:', err.message || err);
    process.exit(1);
  }
}

run();
