-- Update icons to use local server paths instead of Google Drive
-- Date: 2025-10-06

-- IMPORTANT: Before running this, download the icons from Google Drive
-- and place them in: public/icons/ folder

-- Update all icon links to use local paths
UPDATE `others` 
SET `link` = CONCAT('/icons/icon_', SUBSTRING_INDEX(other_name, '_', -1), '.png')
WHERE `category` = 'ICON';

-- Verify the update
SELECT other_id, other_name, link FROM `others` WHERE category = 'ICON';

-- Expected result:
-- ICON_1 -> /icons/icon_1.png
-- ICON_2 -> /icons/icon_2.png
-- etc.
