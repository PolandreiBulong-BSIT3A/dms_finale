-- Revert Database to 3 Roles Only (ADMIN, DEAN, FACULTY)
-- Run this SQL script in your MySQL database

-- WARNING: This will convert any PRINCIPAL, DEPT_SECRETARY, or PRESIDENT roles to DEAN
-- Make sure to backup your database before running this!

-- Step 1: Update existing users with new roles to DEAN
UPDATE `dms_user` 
SET `role` = 'DEAN' 
WHERE `role` IN ('PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT');

-- Step 2: Update announcement_roles table
UPDATE `announcement_roles` 
SET `role` = 'DEAN' 
WHERE `role` IN ('PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT');

-- Step 3: Update document_roles table
UPDATE `document_roles` 
SET `role` = 'DEAN' 
WHERE `role` IN ('PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT');

-- Step 4: Update notification_roles table
UPDATE `notification_roles` 
SET `role` = 'DEAN' 
WHERE `role` IN ('PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT');

-- Step 5: Update document_actions table
UPDATE `document_actions` 
SET `assigned_to_role` = 'DEAN' 
WHERE `assigned_to_role` IN ('PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT');

-- Step 6: Alter ENUM columns to remove extra roles
ALTER TABLE `dms_user` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY') DEFAULT 'FACULTY';

ALTER TABLE `announcement_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY') NOT NULL;

ALTER TABLE `document_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY') NOT NULL;

ALTER TABLE `notification_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY') NOT NULL;

ALTER TABLE `document_actions` 
MODIFY COLUMN `assigned_to_role` ENUM('ADMIN','DEAN','FACULTY') DEFAULT NULL;

-- Verification queries
SELECT 'Users by role:' as info;
SELECT role, COUNT(*) as count FROM dms_user GROUP BY role;

SELECT 'Database schema updated successfully!' as status;
