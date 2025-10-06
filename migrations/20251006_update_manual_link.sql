-- Update the USER & MAINTENANCE MANUAL link to the correct document
-- Replace the URL below with your actual maintenance manual Google Drive link

UPDATE `others` 
SET `link` = 'YOUR_ACTUAL_MAINTENANCE_MANUAL_LINK_HERE'
WHERE `category` = 'MANUAL' 
  AND `other_name` = 'USER & MAINTENANCE MANUAL';

-- Example (replace with your real link):
-- UPDATE `others` 
-- SET `link` = 'https://drive.google.com/file/d/YOUR_MANUAL_FILE_ID/view?usp=sharing'
-- WHERE `category` = 'MANUAL' 
--   AND `other_name` = 'USER & MAINTENANCE MANUAL';
