-- Migration: Create optimized `others` table
-- Date: 2025-10-06

-- Note: Requires existing `dms_user` table with primary key `user_id`

CREATE TABLE IF NOT EXISTS `others` (
  `other_id` INT(11) NOT NULL AUTO_INCREMENT,
  `other_name` VARCHAR(255) NOT NULL,
  `category` ENUM('ICON','MANUAL','POLICY','TERMS','INFO') NOT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  `created_by_user_id` INT(11) NULL,
  `updated_by_user_id` INT(11) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`other_id`),
  UNIQUE KEY `uq_others_category_name` (`category`, `other_name`),
  KEY `idx_category` (`category`),
  CONSTRAINT `fk_others_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user`(`user_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_others_updated_by` FOREIGN KEY (`updated_by_user_id`) REFERENCES `dms_user`(`user_id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional: seed data (without user links). Update IDs after if you know the user_id values.
INSERT INTO `others` (`other_name`, `category`, `link`, `created_by_user_id`, `updated_by_user_id`)
VALUES
('ICON_1', 'ICON', 'https://drive.google.com/file/d/1FusI-JQ9lX-VbqxvyUJ1Wc_XnvJqjAPg/view?usp=sharing', NULL, NULL),
('ICON_2', 'ICON', 'https://drive.google.com/file/d/1-Adn8KZ_73Vx6cIxfS8h9zhPVW46aBcS/view?usp=sharing', NULL, NULL),
('ICON_3', 'ICON', 'https://drive.google.com/file/d/13rVeegjvILrGkOKwuBKlW12IixNgjV29/view?usp=sharing', NULL, NULL),
('ICON_4', 'ICON', 'https://drive.google.com/file/d/1K63Jxa_3RSNYFA0iuPspQY5tvLALdcaV/view?usp=sharing', NULL, NULL),
('ICON_5', 'ICON', 'https://drive.google.com/file/d/1K63Jxa_3RSNYFA0iuPspQY5tvLALdcaV/view?usp=sharing', NULL, NULL),
('ICON_6', 'ICON', 'https://drive.google.com/file/d/1ueziFQAKSjAw_XE_DGdR8Z4hRY9dCzZK/view?usp=drive_link', NULL, NULL),
('ICON_7', 'ICON', 'https://drive.google.com/file/d/1lb8sv5gnPaat4MGSJsYcbwdpX4U7PmVJ/view?usp=sharing', NULL, NULL),
('ICON_8', 'ICON', 'https://drive.google.com/file/d/1lb8sv5gnPaat4MGSJsYcbwdpX4U7PmVJ/view?usp=sharing', NULL, NULL),
('ICON_9', 'ICON', 'https://drive.google.com/file/d/17WO7IdUj6_uHbWxNn5sGeNRICjoYgKey/view?usp=sharing', NULL, NULL),
('ICON_10', 'ICON', 'https://drive.google.com/file/d/1-HYoIepRQrZZW32Hc1MeqoRM3b-Dgn3P/view?usp=drive_link', NULL, NULL),
('ICON_11', 'ICON', 'https://drive.google.com/file/d/1-HYoIepRQrZZW32Hc1MeqoRM3b-Dgn3P/view?usp=drive_link', NULL, NULL),
('ICON_12', 'ICON', 'https://drive.google.com/file/d/11E8gXTR4BXeywmO3VzqbJQtGeU-086Oq/view?usp=drive_link', NULL, NULL),
('ICON_13', 'ICON', 'https://drive.google.com/file/d/11E8gXTR4BXeywmO3VzqbJQtGeU-086Oq/view?usp=drive_link', NULL, NULL),
('ICON_14', 'ICON', 'https://drive.google.com/file/d/11E8gXTR4BXeywmO3VzqbJQtGeU-086Oq/view?usp=drive_link', NULL, NULL),
('USER & MAINTENANCE MANUAL', 'MANUAL', 'https://drive.google.com/file/d/11E8gXTR4BXeywmO3VzqbJQtGeU-086Oq/view?usp=drive_link', NULL, NULL),
('PRIVACY POLICY', 'POLICY', 'https://docs.google.com/document/d/176P3Zt5Oa57zzcK_L41Yf7oL0GFLGYWaGaFGJg3l56o/edit?usp=sharing', NULL, NULL),
('TERMS & CONDITIONS', 'TERMS', 'https://docs.google.com/document/d/16NjJI5X69m0wcCv33NK5VP2oEm3rnqVwDoQqfx_ZZn0/edit?usp=drive_link', NULL, NULL),
('CONTACT', 'INFO', 'polandreiladera03@gmail.com', NULL, NULL);
