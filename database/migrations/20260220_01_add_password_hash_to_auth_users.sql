-- Add password_hash column to auth_users for direct email/password authentication
-- (the change-password route needs this column)

ALTER TABLE auth_users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE auth_users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
