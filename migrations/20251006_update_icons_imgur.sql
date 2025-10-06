-- Update icons to use Imgur direct links
-- Date: 2025-10-06
-- INSTRUCTIONS: Replace 'IMGUR_LINK_HERE' with your actual Imgur direct links

-- Update ICON_1 (keeping existing or add your link)
-- UPDATE `others` 
-- SET `link` = 'YOUR_ICON_1_LINK_HERE'
-- WHERE `category` = 'ICON' AND `other_name` = 'ICON_1';

-- Update ICON_2
UPDATE `others` 
SET `link` = 'https://i.imgur.com/rthDwK6.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_2';

-- Update ICON_3
UPDATE `others` 
SET `link` = 'https://i.imgur.com/IJ0XY4O.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_3';

-- Update ICON_4
UPDATE `others` 
SET `link` = 'https://i.imgur.com/9dAHRk6.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_4';

-- Update ICON_5
UPDATE `others` 
SET `link` = 'https://i.imgur.com/qVlV7PQ.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_5';

-- Update ICON_6
UPDATE `others` 
SET `link` = 'https://i.imgur.com/esoqCrY.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_6';

-- Update ICON_7
UPDATE `others` 
SET `link` = 'https://i.imgur.com/r5F2yu6.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_7';

-- Update ICON_8
UPDATE `others` 
SET `link` = 'https://i.imgur.com/CjyQ5O0.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_8';

-- Update ICON_9
UPDATE `others` 
SET `link` = 'https://i.imgur.com/hqw5Nst.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_9';

-- Update ICON_10
UPDATE `others` 
SET `link` = 'https://i.imgur.com/zegmH78.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_10';

-- Update ICON_11
UPDATE `others` 
SET `link` = 'https://i.imgur.com/OdNn6V3.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_11';

-- Update ICON_12
UPDATE `others` 
SET `link` = 'https://i.imgur.com/ZMhF0SD.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_12';

-- Update ICON_13
UPDATE `others` 
SET `link` = 'https://i.imgur.com/MnE7tkW.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_13';

-- Update ICON_14
UPDATE `others` 
SET `link` = 'https://i.imgur.com/GdufXPv.png'
WHERE `category` = 'ICON' AND `other_name` = 'ICON_14';

-- Verify the updates
SELECT other_id, other_name, link 
FROM `others` 
WHERE category = 'ICON' 
ORDER BY other_id;
