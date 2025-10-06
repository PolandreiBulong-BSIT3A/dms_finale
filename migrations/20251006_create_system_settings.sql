-- Create system_settings table for maintenance mode
-- Date: 2025-10-06

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `maintenance_mode` tinyint(1) NOT NULL DEFAULT 0,
  `maintenance_message` text DEFAULT NULL,
  `maintenance_start_time` datetime DEFAULT NULL,
  `maintenance_end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default row
INSERT INTO `system_settings` (`id`, `maintenance_mode`) 
VALUES (1, 0)
ON DUPLICATE KEY UPDATE `id` = 1;

-- Verify
SELECT * FROM `system_settings`;
