-- Add startMonth and endMonth columns to expense_limits table
ALTER TABLE expense_limits 
ADD COLUMN IF NOT EXISTS "startMonth" INTEGER,
ADD COLUMN IF NOT EXISTS "endMonth" INTEGER;
