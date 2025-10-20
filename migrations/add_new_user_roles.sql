-- Migration: Add new user roles (PRINCIPAL, DEPT_SECRETARY, PRESIDENT)
-- These roles will have the same permissions as DEAN

-- 1. Update dms_user table role enum
ALTER TABLE `dms_user` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') DEFAULT 'FACULTY';

-- 2. Update announcement_roles table
ALTER TABLE `announcement_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

-- 3. Update document_roles table
ALTER TABLE `document_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

-- 4. Update notification_roles table
ALTER TABLE `notification_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

-- 5. Update document_actions table
ALTER TABLE `document_actions` 
MODIFY COLUMN `assigned_to_role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') DEFAULT NULL;

-- Verification queries (run these to check if migration was successful)
-- SHOW COLUMNS FROM dms_user LIKE 'role';
-- SHOW COLUMNS FROM announcement_roles LIKE 'role';
-- SHOW COLUMNS FROM document_roles LIKE 'role';
-- SHOW COLUMNS FROM notification_roles LIKE 'role';
-- SHOW COLUMNS FROM document_actions LIKE 'assigned_to_role';
