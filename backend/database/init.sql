-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table (minimal columns used by the app)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nic varchar(12) UNIQUE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  date_of_birth date,
  gender varchar(20),
  whatsapp_number varchar(20) UNIQUE,
  email varchar(254),
  password_hash text,
  role varchar(50) DEFAULT 'passenger',
  status varchar(50) DEFAULT 'active',
  wallet_balance numeric DEFAULT 0,
  loyalty_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
