-- Add password reset columns to dms_user table
-- Run this migration if columns don't exist

ALTER TABLE dms_user 
ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset ON dms_user(user_email, password_reset_code, password_reset_expires);
