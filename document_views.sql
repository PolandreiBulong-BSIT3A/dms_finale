-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 01, 2025 at 11:44 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u185173985_ispsc_tag_dms`
--

-- --------------------------------------------------------

--
-- Table structure for table `document_views`
--

CREATE TABLE `document_views` (
  `id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `viewed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_views`
--

INSERT INTO `document_views` (`id`, `doc_id`, `user_id`, `viewed_at`) VALUES
(1, 42, 142, '2025-11-26 00:54:10'),
(2, 574, 210, '2025-11-27 02:26:38'),
(4, 572, 210, '2025-11-27 02:26:55'),
(5, 11, 210, '2025-11-27 02:26:58'),
(6, 10, 210, '2025-11-27 02:27:02'),
(7, 4, 146, '2025-11-27 02:27:39'),
(8, 574, 146, '2025-11-27 02:27:46'),
(9, 11, 1, '2025-12-01 04:01:22'),
(11, 46, 1, '2025-11-27 09:39:04'),
(13, 45, 1, '2025-11-27 09:39:25'),
(16, 44, 1, '2025-11-27 09:39:32'),
(17, 575, 1, '2025-11-27 09:39:45'),
(18, 573, 1, '2025-11-27 09:39:53'),
(35, 11, 142, '2025-11-28 00:13:50'),
(36, 576, 1, '2025-12-01 04:01:45'),
(41, 577, 1, '2025-12-01 21:00:15'),
(44, 579, 1, '2025-12-01 20:51:21'),
(46, 578, 1, '2025-12-01 21:00:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `document_views`
--
ALTER TABLE `document_views`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_doc_user` (`doc_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `document_views`
--
ALTER TABLE `document_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `document_views`
--
ALTER TABLE `document_views`
  ADD CONSTRAINT `document_views_ibfk_1` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_views_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
