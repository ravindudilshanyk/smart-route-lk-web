const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  try {
    const users = [
      {
        nic: 'SEED000001',
        first_name: 'Seed',
        last_name: 'Complete',
        date_of_birth: '1990-01-01',
        gender: 'other',
        whatsapp_number: '+94770000011',
        email: 'seed.complete@example.com',
        password: 'Password123!'
      },
      {
        nic: 'SEED000002',
        first_name: 'Seed',
        last_name: 'Incomplete',
        // no date_of_birth -> incomplete profile
        gender: 'other',
        whatsapp_number: '+94770000012',
        email: 'seed.incomplete@example.com',
        password: 'Password123!'
      }
    ];

    for (const u of users) {
      // skip if exists
      const check = await pool.query('SELECT id FROM users WHERE whatsapp_number=$1', [u.whatsapp_number]);
      if (check.rows.length > 0) {
        console.log('User exists, skipping', u.whatsapp_number);
        continue;
      }
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(u.password, salt);
      const result = await pool.query(
        `INSERT INTO users (nic, first_name, last_name, date_of_birth, gender, whatsapp_number, email, password_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [u.nic, u.first_name, u.last_name, u.date_of_birth || null, u.gender, u.whatsapp_number, u.email, password_hash]
      );
      console.log('Inserted user', result.rows[0].id, u.whatsapp_number);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(2);
  }
}

seed();
