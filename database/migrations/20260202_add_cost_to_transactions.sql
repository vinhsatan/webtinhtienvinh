-- Migration: Add cost column to transactions table
-- Date: 2026-01-30
-- Purpose: Store cost of goods sold (COGS) for profit calculation

-- Add cost column (can be NULL for non-sales transactions)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.cost IS 'Cost of goods sold (giá vốn) for calculating profit. NULL for non-sales transactions.';
