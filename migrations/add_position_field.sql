-- Add position/designation field to dms_user table
-- This allows users to have the same role but different positions
-- Example: Role = DEAN, Position = Secretary, Dean, Assistant Dean, etc.

-- Add position column to dms_user table
ALTER TABLE dms_user 
ADD COLUMN position VARCHAR(100) NULL AFTER role;

-- Update existing users with default positions based on their roles (optional)
UPDATE dms_user SET position = 'Administrator' WHERE role = 'ADMIN' AND position IS NULL;
UPDATE dms_user SET position = 'Dean' WHERE role = 'DEAN' AND position IS NULL;
UPDATE dms_user SET position = 'Faculty Member' WHERE role = 'FACULTY' AND position IS NULL;

-- Add index for faster queries
CREATE INDEX idx_dms_user_position ON dms_user(position);

-- Show the updated table structure
DESCRIBE dms_user;

-- Verify the changes
SELECT user_id, Username, role, position 
FROM dms_user 
LIMIT 10;
