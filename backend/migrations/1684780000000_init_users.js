exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nic: { type: 'varchar(12)', unique: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    date_of_birth: { type: 'date' },
    gender: { type: 'varchar(20)' },
    whatsapp_number: { type: 'varchar(20)', unique: true },
    email: { type: 'varchar(254)' },
    password_hash: { type: 'text' },
    role: { type: 'varchar(50)', default: 'passenger' },
    status: { type: 'varchar(50)', default: 'active' },
    wallet_balance: { type: 'numeric', default: 0 },
    loyalty_points: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp with time zone', default: pgm.func('now()') }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
