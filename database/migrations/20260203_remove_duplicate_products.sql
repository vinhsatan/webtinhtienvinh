-- Migration: Remove duplicate products
-- Created: 2026-01-30
-- Purpose: Remove products with same user_id + name + price, keep the oldest one

-- This migration is data cleanup and should run after main tables are created

-- Now delete the duplicates, keeping only the oldest one for each group
WITH duplicate_groups AS (
    SELECT 
        user_id,
        name,
        price,
        cost,
        ARRAY_AGG(id ORDER BY created_at ASC) as all_ids
    FROM products
    GROUP BY user_id, name, price, cost
    HAVING COUNT(*) > 1
),
ids_to_delete AS (
    SELECT 
        UNNEST(all_ids[2:]) as id_to_delete
    FROM duplicate_groups
)
DELETE FROM products
WHERE id IN (SELECT id_to_delete FROM ids_to_delete);
