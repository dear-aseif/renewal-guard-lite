-- Renewal Guard v2 — Turso (libSQL) schema
-- Run with: turso db shell <db-name> < migrations/001_init.sql

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                -- same UUID as the Dexie record
  name TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('IDR', 'USD', 'EUR', 'OTHER')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly', 'custom')),
  custom_cycle_days INTEGER,
  next_renewal_date TEXT NOT NULL,    -- YYYY-MM-DD (local date)
  payment_method TEXT,
  account_email TEXT,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('ready', 'need_top_up', 'review_first')),
  reminder_days_before INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  created_at TEXT NOT NULL,           -- ISO 8601
  updated_at TEXT NOT NULL,           -- ISO 8601, used for last-write-wins
  deleted_at TEXT                     -- soft delete so removals sync across devices
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal
  ON subscriptions (next_renewal_date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_at
  ON subscriptions (updated_at);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tracks which subscriptions already received a reminder on a given day,
-- so the daily cron is idempotent and never double-notifies.
CREATE TABLE IF NOT EXISTS notified_days (
  subscription_id TEXT NOT NULL,
  day TEXT NOT NULL,                  -- YYYY-MM-DD
  PRIMARY KEY (subscription_id, day)
);
