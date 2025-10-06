-- Add social media links to others table
-- Date: 2025-10-06

-- Add Facebook link
INSERT INTO `others` (`other_name`, `category`, `link`)
VALUES ('FACEBOOK', 'INFO', 'https://facebook.com/ispsc')
ON DUPLICATE KEY UPDATE link = 'https://facebook.com/ispsc';

-- Add Twitter link
INSERT INTO `others` (`other_name`, `category`, `link`)
VALUES ('TWITTER', 'INFO', 'https://twitter.com/ispsc')
ON DUPLICATE KEY UPDATE link = 'https://twitter.com/ispsc';

-- Add Instagram link
INSERT INTO `others` (`other_name`, `category`, `link`)
VALUES ('INSTAGRAM', 'INFO', 'https://instagram.com/ispsc')
ON DUPLICATE KEY UPDATE link = 'https://instagram.com/ispsc';

-- Verify
SELECT * FROM `others` WHERE `category` = 'INFO' ORDER BY `other_name`;
