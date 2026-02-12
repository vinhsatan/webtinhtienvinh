-- Add missing columns to wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS cash DECIMAL(12,2) DEFAULT 0;

-- Add missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
