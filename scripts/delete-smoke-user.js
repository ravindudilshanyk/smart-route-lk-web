const fs = require('fs');
const path = require('path');

// Load backend .env into process.env if present
try {
  const envPath = path.resolve(__dirname, '../backend/.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (m) {
        const key = m[1];
        let val = m[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
} catch (err) {
  console.warn('Could not load backend .env:', err.message);
}

const { pool } = require('../backend/src/config/db');

(async () => {
  try {
    const res = await pool.query("DELETE FROM users WHERE nic = $1 OR email = $2 RETURNING id, nic, email", [
      'SMK001',
      'smoke+01@example.com',
    ]);
    console.log('Deleted rows:', res.rowCount);
    if (res.rowCount > 0) console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting smoke user:', err.message);
    process.exit(1);
  }
})();
