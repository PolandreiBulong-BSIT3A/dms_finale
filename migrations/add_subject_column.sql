-- Migration: Add subject column to dms_documents table
-- Date: 2025-10-15
-- Description: Separates subject from description field

-- Add subject column after title
ALTER TABLE `dms_documents` 
ADD COLUMN `subject` VARCHAR(500) NULL DEFAULT NULL 
AFTER `title`;

-- Optional: Migrate existing description data to subject if needed
-- Uncomment the line below if you want to copy first 500 chars of description to subject
-- UPDATE `dms_documents` SET `subject` = LEFT(`description`, 500) WHERE `description` IS NOT NULL;

-- Add index for better search performance
CREATE INDEX `idx_subject` ON `dms_documents` (`subject`);

-- Verify the change
-- SELECT * FROM `dms_documents` LIMIT 1;
