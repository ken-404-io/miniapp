-- Run this in the Neon SQL editor or via: psql $DATABASE_URL -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  total_earned NUMERIC(12,2) DEFAULT 0,
  earning_enabled BOOLEAN DEFAULT true,
  banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_views (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT REFERENCES users(telegram_id),
  reward NUMERIC(12,2) NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_views_user_time ON ad_views(telegram_id, created_at DESC);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT REFERENCES users(telegram_id),
  amount NUMERIC(12,2) NOT NULL,
  channel TEXT NOT NULL,          -- 'GCASH' | 'MAYA'
  account_number TEXT NOT NULL,   -- 11-digit PH mobile number
  account_name TEXT NOT NULL,     -- recipient full name
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'rejected'
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Atomic balance increment — never read-then-write in app code
CREATE OR REPLACE FUNCTION increment_balance(tg_id BIGINT, amt NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET balance = balance + amt,
      total_earned = total_earned + amt,
      last_seen = now()
  WHERE telegram_id = tg_id AND banned = false;
END; $$ LANGUAGE plpgsql;
