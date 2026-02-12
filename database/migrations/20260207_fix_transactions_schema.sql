-- Fix transactions table schema to match API requirements
-- This migration recreates the transactions table with all required columns

-- Drop existing constraints first
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS fk_transactions_order;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS fk_transactions_wallet;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS fk_transactions_category;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS fk_transactions_user;

-- Drop existing table
DROP TABLE IF EXISTS transactions CASCADE;

-- Recreate transactions table with correct schema
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL, -- income, expense, nhap, ung_hang, debt_payment
  amount DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2),
  wallet VARCHAR(50) NOT NULL, -- cash, bank
  category VARCHAR(255),
  note TEXT,
  party VARCHAR(255),
  creditor VARCHAR(255),
  linked_order_id INTEGER,
  needs_payment BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'completed',
  original_amount DECIMAL(12,2),
  remaining_amount DECIMAL(12,2),
  original_quantity INTEGER,
  remaining_quantity INTEGER,
  order_items JSONB,
  is_reconciliation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) 
    REFERENCES auth_users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet);
