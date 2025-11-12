-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 11, 2025 at 11:49 PM
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
-- Table structure for table `action_required`
--

CREATE TABLE `action_required` (
  `action_id` int(11) NOT NULL,
  `action_name` varchar(255) NOT NULL,
  `action_description` text DEFAULT NULL,
  `action_category` enum('decision','communication','document_management','administrative','custom') DEFAULT 'custom',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `action_required`
--

INSERT INTO `action_required` (`action_id`, `action_name`, `action_description`, `action_category`, `is_active`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'Appropriate Action', 'Take appropriate action based on document content', 'decision', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(2, 'Study/Information', 'Study the document for information purposes', 'decision', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(3, 'Signature', 'Document requires signature', 'decision', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(4, 'Clearance/Approval', 'Document requires clearance or approval', 'decision', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(5, 'Comments/Feedback', 'Provide comments or feedback on the document', 'communication', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(6, 'Reply', 'Reply to the document or sender', 'communication', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(7, 'Take up with me', 'Discuss the document in person', 'communication', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(8, 'File', 'File the document for record keeping', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(9, 'Return', 'Return the document to sender', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(10, 'Submit Report', 'Submit a report based on the document', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(11, 'Submit CSW', 'Submit CSW (Complete Staff Work)', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(12, 'Attendance', 'Mark attendance or participation', 'administrative', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(13, 'Review', 'Review the document thoroughly', 'decision', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(14, 'Prepare Memo/Special', 'Prepare a memo or special order', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(15, 'Order/Office Order', 'Issue an order or office order', 'document_management', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1),
(16, 'Representation', 'Handle representation on behalf of', 'administrative', 1, '2024-12-31 16:00:00', '2024-12-31 16:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `status` enum('draft','scheduled','published','archived') DEFAULT 'draft',
  `publish_at` datetime DEFAULT NULL,
  `expire_at` datetime DEFAULT NULL,
  `created_by_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `title`, `body`, `visible_to_all`, `status`, `publish_at`, `expire_at`, `created_by_name`, `created_at`, `updated_at`) VALUES
(53, 'ARE YOU A FACULTY?', 'FACULTY USER FEATURES IN THE ISPSC DOCUMENT MANAGEMENT SYSTEM\n\nFaculty users in the ISPSC Document Management System (DMS) have broad access to view, organize, and interact with system resources. Their capabilities include:\n\nDocument Management\n1. Browse and search all documents across the system\n2. Preview documents before downloading\n3. Mark documents as favorites or pinned for quick access\n4. Manage document revisions and view completed request histories\n\nAnnouncements & Notifications\n1. View institution-wide and department-specific announcements\n2. Receive real-time notifications for:\n    A. Document assignments\n    B. Status changes\n    C. System events\n\nRequests & Workflows\n\n1. Access the Requests Module to view pending actions\n2. Respond to documents requiring their attention (personal, departmental, or role-based)\n3. Mark assigned tasks as complete, triggering automated notifications\n4. Participate in department-specific document workflows\n\nUser & Profile Management\n1. View profiles of users within their department or across the institution\n2. Manage their personal profile and account settings\n\nFACULTY RESTRICTIONS\nWhile faculty users have extensive functionality, their permissions are limited to ensure proper role management:\nCannot create, edit, or delete system-wide announcements (reserved for Admin and Dean roles)\nCannot access the administrative system management functions\nCannot send direct user-to-user or broadcast messages', 1, 'published', '2025-10-14 06:40:42', NULL, 'ADMIN DEV.', '2025-10-14 06:40:42', '2025-10-14 06:40:42'),
(54, 'ARE YOU A DEAN?', 'DEAN USER FEATURES IN THE ISPSC DOCUMENT MANAGEMENT SYSTEM\n\nDean users in the ISPSC Document Management System (DMS) have extensive administrative authority within their department. Their role includes advanced document handling, request management, and department-level oversight.\n\nDocument Management\n1. Upload documents with full visibility controls\n2. Organize files into folders for departmental use\n3. Search and filter documents using advanced criteria\n4. View completed request histories\n\nAnnouncements & Notifications\n1. Create department-wide announcements (limited to their own department)\n2. Receive real-time notifications for:\n    A. Department-level events\n    B. New assignments\n    C. Workflow updates\n\nRequests & Workflows\nA. Handle document requests and workflows across their department\nB. Respond to and complete document actions assigned at the departmental level\nC. Create and reply to document workflows for better collaboration\n\nDepartment & User Management\nA. Manage user accounts within their department:\nB. View pending and active users\nC. Update user roles and department assignments\nD. Move users to trash or perform permanent deletion\nE. Access the Admin Panel for department-level oversight\n\n\nProfile & Personal Management\nA. Maintain full control over their personal profile and settings\n\nDEAN RESTRICTIONS\nA. Although Deans have significant authority, they do not have system-wide control:\n    Cannot create public (system-wide) announcements (restricted to Admin users)\n    Cannot access system-wide analytics reports', 1, 'published', '2025-10-14 06:54:37', NULL, 'ADMIN DEV.', '2025-10-14 06:54:37', '2025-10-14 06:54:37'),
(55, 'ARE YOU AN ADMIN?', 'ADMIN USER FEATURES IN THE ISPSC DOCUMENT MANAGEMENT SYSTEM\n\nAdmin users hold the highest level of authority in the ISPSC Document Management System (DMS). They have complete system-wide access and control, encompassing all Dean and Faculty features, plus advanced administrative capabilities for system management and oversight.\n\nDocument & System Resource Management\nA. Manage all documents across the system with full visibility controls\nB. Oversee document types and folder structures system-wide\nC. Administer and monitor system-wide workflows and request processes\n4. Manage additional system resources such as icons, user manuals, and guides\n\nAnnouncements & Notifications\nA. Create public (system-wide) announcements visible to all users\nB. Manage notifications for all system events, workflows, and assignments\n\nUser & Department Management\nA. Full CRUD operations (Create, Read, Update, Delete) for all user accounts\nB. Create and manage new users, roles, and department assignments\nC. Oversee all user activity across the institution\nD. Manage and create new departmental structures\n\nAnalytics & Monitoring\nA. Access full system analytics and reports, including Streamlit dashboards\nB. Monitor system-wide activity logs and performance metrics\nC. Track departmental and institutional-level workflows, requests, and usage\n\nSystem Administration\nA. Maintain system health monitoring and performance tracking\nB. Configure and manage system maintenance modes, including:\nC. Scheduled downtime\nD. Oversee system backups and restoration\n\nProfile & Personal Management\nA. Maintain and update their personal profile and system preferences\nB. Unrestricted access to all system settings and configurations\n\nADMIN RESTRICTIONS\nAdmin users have no restrictions. They possess full system-wide access and control over all features, functions, and configurations.', 1, 'published', '2025-10-14 07:05:59', NULL, 'ADMIN DEV.', '2025-10-14 07:05:59', '2025-10-14 07:05:59'),
(56, 'THE CHOOSING OF USER FOR ADMIN AND DEAN ROLE', 'First-time users are automatically assigned the Faculty role. Admin and Dean roles are given based on academic positions, for example, Sir Daniel as Admin, Ma’am Joy Bea as CAS Dean, or any assigned faculty staff from the Campus Director’s office. If you’re curious and would like to try out other roles or explore their features, just send a message to the developers by clicking the message icon in the navbar.', 1, 'published', '2025-10-14 09:44:35', NULL, 'ADMIN DEV.', '2025-10-14 09:44:35', '2025-10-14 09:51:40'),
(57, 'ABOUT THE DOCUMENTS', 'The documents currently in the system are provided as sample data from the Campus Director’s office. Please note that these files are outdated and are used only for demonstration purposes. They are meant to help first-time users explore the system’s features such as searching, organizing, and responding to requests. Actual and updated documents will be uploaded once the system is fully deployed. In the meantime, feel free to browse and interact with the sample files to get familiar with how the system works.', 1, 'published', '2025-10-14 09:58:05', NULL, 'ADMIN DEV.', '2025-10-14 09:58:05', '2025-10-14 10:02:46'),
(64, 'INTRODUCTION TO THE DOCUMENT MANAGEMENT SYSTEM (DMS)', 'We are pleased to present the Document Management System (DMS), a project developed by our team as part of our academic requirements.\n\nThe system is now available for initial use by staff members and Supreme Student Council officers. Its primary goal is to enhance the organization, storage, and accessibility of documents within the institution.\n\nWe encourage users to explore the system and familiarize themselves with its features. Since this is the initial deployment phase, further improvements and modifications will be made based on feedback from the final defense and user evaluation.\n\nYour cooperation, support, and constructive feedback will be greatly appreciated as we continue to refine the system to better serve its purpose.\n\nNOTE 1: For the officers of the Supreme Student Council of Tagudin Campus, accounts have been temporarily configured under the Faculty role. This setup is provisional and will be updated in future revisions of the system.\n\nNOTE 2: If any issues or problems are encountered while using the system, please contact the developer for assistance.\n\n— DEVELOPMENT TEAM', 1, 'published', '2025-10-22 02:22:54', NULL, 'ADMIN DEV.', '2025-10-22 02:22:54', '2025-10-22 02:22:54');

-- --------------------------------------------------------

--
-- Table structure for table `announcement_departments`
--

CREATE TABLE `announcement_departments` (
  `announcement_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement_roles`
--

CREATE TABLE `announcement_roles` (
  `announcement_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement_users`
--

CREATE TABLE `announcement_users` (
  `announcement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `name`, `code`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'College of Arts and Sciences', 'CAS', 1, '2025-09-30 01:29:43', '2025-09-30 01:29:43'),
(2, 'College of Business Management And Entreprenuership', 'CBME', 1, '2025-09-30 01:29:43', '2025-10-19 09:04:58'),
(3, 'College of Teacher Education', 'CTE', 1, '2025-09-30 01:29:43', '2025-09-30 01:29:43'),
(4, 'Laboratory High School', 'LHS', 1, '2025-09-30 01:29:43', '2025-09-30 01:29:43'),
(6, 'Graduate School', 'GRADUATE SCHOOL', 1, '2025-09-30 01:29:43', '2025-09-30 01:29:43'),
(999, 'Unassigned', 'UNASSIGNED', 1, '2025-09-30 02:34:44', '2025-09-30 02:34:44'),
(1000, 'Developer', 'TECH', 1, '2025-10-05 22:54:14', '2025-10-05 22:54:14'),
(1001, 'Supreme Student Government', 'SSC', 1, '2025-10-14 07:09:24', '2025-10-14 07:09:24'),
(1002, 'Non-teaching staff', 'NTS', 1, '2025-10-15 03:59:46', '2025-10-15 03:59:46');

-- --------------------------------------------------------

--
-- Table structure for table `dms_documents`
--

CREATE TABLE `dms_documents` (
  `doc_id` int(11) NOT NULL,
  `doc_type` int(11) NOT NULL,
  `folder_id` int(11) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `revision` varchar(50) DEFAULT NULL,
  `rev_date` date DEFAULT NULL,
  `from_field` varchar(255) DEFAULT NULL,
  `to_field` varchar(255) DEFAULT NULL,
  `date_received` date DEFAULT NULL,
  `google_drive_link` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `available_copy` enum('hard_copy','soft_copy','both') DEFAULT 'soft_copy',
  `received_by` varchar(255) DEFAULT NULL,
  `received_by_user_id` int(11) DEFAULT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `allowed_user_ids` text DEFAULT NULL,
  `allowed_roles` text DEFAULT NULL,
  `status` enum('active','inactive','pending','deleted') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by_name` varchar(150) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by_name` varchar(150) DEFAULT NULL,
  `restored_at` datetime DEFAULT NULL,
  `restored_by_name` varchar(150) DEFAULT NULL,
  `is_reply_to_doc_id` int(11) DEFAULT NULL,
  `reply_type` varchar(50) DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `visibility` enum('ALL','DEPARTMENT','SPECIFIC_USERS','SPECIFIC_ROLES','ROLE_DEPARTMENT') DEFAULT 'ALL',
  `target_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_users`)),
  `target_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_roles`)),
  `target_role_dept` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_role_dept`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dms_documents`
--

INSERT INTO `dms_documents` (`doc_id`, `doc_type`, `folder_id`, `reference`, `title`, `subject`, `revision`, `rev_date`, `from_field`, `to_field`, `date_received`, `google_drive_link`, `description`, `available_copy`, `received_by`, `received_by_user_id`, `visible_to_all`, `allowed_user_ids`, `allowed_roles`, `status`, `created_at`, `updated_at`, `created_by_name`, `deleted`, `deleted_at`, `deleted_by_name`, `restored_at`, `restored_by_name`, `is_reply_to_doc_id`, `reply_type`, `created_by_user_id`, `visibility`, `target_users`, `target_roles`, `target_role_dept`) VALUES
(1, 1008, 1004, '', 'Office Memo No. O-71, S. 2025', 'SUBMISSION OF LIST OF FACULTY/EMPLOYEES WHO ARE AACCUP ACCREDITORS', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1ALmryQI_9gRkNH2o8psINUreY2PcgI8p/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:47:30', '2025-11-11 17:18:33', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(2, 1008, 1004, '', 'Office Memo No. O-79, S. 2025', 'CONDUCT OF FSSC ACTIVITIES', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1QHeHLpDpVJOcZzsT1O7aa7PFaAq_dYry/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:48:50', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(3, 1008, 1004, '', 'Office Memo No. O-80, S. 2025', 'NOTICE OF MEETING', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1XG4_JUp0c4kX5io-LT8c00B7CurHN0Xv/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:53:45', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(4, 1008, 1004, '', 'Office Memo No. O-82, S. 2025', 'REVIEW OF THE RDE MANUAL', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1IvNETq-aGdQWtC-iarE2c9zo5Fj5TrvP/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:54:33', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(5, 1008, 1004, '', 'Office Memo No. O-83, S. 2025', 'VIRTUAL MEETING AND ONBOARDING SESSION ON CAREER PORTAL', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1euMUQtfb83IdzjG6rEwRIAi_cOqNZHEU/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:55:34', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(6, 1008, 1004, '', 'Office Memo No. O-86, S. 2025', 'PRACTICE SCHEDULE OF ASCU-SN 2025 DELEGATES', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1_wdX_D-Ob3SNttUgdIJdMz99rHwqGmB6/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 02:56:19', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(7, 1008, 1004, '', 'Office Memo No. O-93, S. 2025', 'ADMINISTRATIVE COUNCIL MEETING', NULL, NULL, 'Archive Office', 'System', '2025-10-14', 'https://drive.google.com/file/d/1yAhje5O8LXgQS6gCDJl6N0RuwKK85Zcz/view?usp=drive_link', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 04:50:39', '2025-10-21 02:40:06', 'JENNILYN BULATAO', 0, NULL, NULL, NULL, NULL, NULL, NULL, 145, 'ALL', NULL, NULL, NULL),
(8, 1008, 1004, 'ISPSC-QAD-F032A', 'Office Memorandum No: 0-59, S. 2025', 'Meeting on commencement exercise preparation', NULL, NULL, 'The President', 'All Concerned', '2025-05-22', 'https://drive.google.com/file/d/1JC7nDfGk3E_t2kpve9MvBDPwhC7X663f/view?usp=sharing', '', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 13:55:35', '2025-10-15 06:13:47', 'ADMIN DEV.', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'ALL', NULL, NULL, NULL),
(9, 1008, 1004, '', 'Office Memorandum No .:0-55, S. 2025', 'CLARIFICATION ON ACADEMIC POLICY IMPLEMENTATION AND ELIGIBILITY FOR LATIN HONERS', NULL, NULL, 'The President', 'Vice President For Academic Affairs, College Registar, All Concerened', '2025-05-16', 'https://drive.google.com/file/d/1933bWzsU5jIc5XMJiumQaj4YQb4kXKjl/view?usp=sharing', '', 'both', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 13:59:06', '2025-10-15 06:14:43', 'ADMIN DEV.', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'ALL', NULL, NULL, NULL),
(10, 1008, 1004, '', 'Office Memorandum No .:0-61, S. 2025', 'SUBMISSION OF LIST OF BUILDINGS, FACILITIES, AND EQUIPMENT NEEDLING ', NULL, NULL, 'The President', 'All Campus Directors, Heads, Physical Plants And Facilities Services, Campus Coordinators For Physical Plants', '2025-05-22', 'https://drive.google.com/file/d/1MNPb4dBfpXPT1zf_GHOFFxqG2PtXSDfP/view?usp=sharing', '', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 14:13:52', '2025-10-15 06:15:44', 'ADMIN DEV.', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'ALL', NULL, NULL, NULL),
(11, 1008, 1004, '', 'Office Memorandum No.: 0-57, S. 2025', 'TEACHER\'S LEAVE ENTITLEMENTS AND REPORTING SCHEDULE', NULL, NULL, 'The President', 'All Faculty Concerned', '2025-05-22', 'https://drive.google.com/file/d/1L2IXvcV1B6R1k6VKwDM5IOaJK_GL2f5V/view?usp=sharing', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 1, NULL, NULL, 'active', '2025-10-14 14:16:06', '2025-11-11 17:18:12', 'ADMIN DEV.', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'ALL', NULL, NULL, NULL),
(12, 1008, 1004, '', 'Office Memorandum No.: 0-56, S. 2025', 'MEETING ON RESEARCH AND EXTENSION BUDGET UTILIZATION FOR 2024 AND 2026', NULL, NULL, 'The President', 'Vp For Administration', '2025-05-20', 'https://drive.google.com/file/d/1IH9jM_5iqNhkKk0yWg8zCtNLGjusOagL/view?usp=sharing', 'This document is intended solely for the system upload test. It serves as a sample file to verify that the upload functionality is working correctly. No actual or sensitive data is included in this document.', 'soft_copy', NULL, NULL, 0, NULL, NULL, 'active', '2025-10-14 14:18:00', '2025-11-11 17:20:22', 'IZRA LATIW', 0, NULL, NULL, NULL, NULL, NULL, NULL, 204, 'DEPARTMENT', NULL, NULL, NULL),
(13, 1008, 1004, '', 'Office Memorandum No.: 0-52, S, 2025', 'CURROCULUM REVIEW', NULL, NULL, 'The President', 'Program Head', '2025-05-09', 'https://drive.google.com/file/d/1bG0xAFULo4OY7NRmu8pY7fPK_QlpG2bg/view?usp=sharing', '', 'soft_copy', NULL, NULL, 0, NULL, NULL, 'active', '2025-10-14 14:19:57', '2025-10-15 06:14:14', 'IZRA LATIW', 0, NULL, NULL, NULL, NULL, NULL, NULL, 204, 'DEPARTMENT', NULL, NULL, NULL),
(14, 1008, 1004, '', 'Office Memorandum No.: 0-53, S. 2025', 'CHANGE OF MEETING OF PROBIOTIC MEETING', NULL, NULL, 'The President', 'All Concerned', '2025-05-09', 'https://drive.google.com/file/d/1zjA7BxCLnkwVIoIB-Bxyj0dR1I8fIz1e/view?usp=sharing', '', 'soft_copy', NULL, NULL, 0, NULL, NULL, 'active', '2025-10-14 14:22:21', '2025-11-11 15:21:57', 'IZRA LATIW', 0, NULL, NULL, NULL, NULL, NULL, NULL, 204, 'DEPARTMENT', NULL, NULL, NULL),
(15, 1008, 1004, '', 'Office Memorandum No.: 0-58, S. 2025', 'SUBMISSION OF OFFICAL TRANSCRIPT OF RECORD', NULL, NULL, 'The President', 'All Faculty And Non Teaching Staff', '2025-05-22', 'https://drive.google.com/file/d/1WBy33aq3QJZQW4bJ41bhLfAzbcpRIj6O/view?usp=sharing', '', 'both', NULL, NULL, 0, NULL, NULL, 'active', '2025-10-14 14:24:48', '2025-10-15 06:10:40', 'IZRA LATIW', 0, NULL, NULL, NULL, NULL, NULL, NULL, 204, 'DEPARTMENT', NULL, NULL, NULL),
(16, 1008, 1004, '', 'Office Memorandum No.: 0-74, S. 2025', 'REQUEST FOR IMMEDIATE TURNOVER OF RESPONSABILITIES TO NEWLY APPOINTED COLLEGE OFFICIALS', NULL, NULL, 'The President', 'All Concerned', '2025-06-11', 'https://drive.google.com/file/d/1wNXwrhnxE_bv0rlZXV0LLOtyDaxW4fOt/view?usp=sharing', '', 'soft_copy', NULL, NULL, 0, NULL, NULL, 'active', '2025-10-14 14:28:16', '2025-11-11 15:20:26', 'IZRA LATIW', 0, NULL, NULL, NULL, NULL, NULL, NULL, 204, 'DEPARTMENT', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dms_user`
--

CREATE TABLE `dms_user` (
  `user_id` int(11) NOT NULL,
  `profile_pic` longtext DEFAULT NULL,
  `user_email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `Username` varchar(100) NOT NULL,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `Contact_number` varchar(20) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') DEFAULT 'FACULTY',
  `position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','inactive','banned','pending','deleted') DEFAULT 'pending',
  `is_verified` enum('yes','no') DEFAULT 'no',
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_code` varchar(10) DEFAULT NULL,
  `password_reset_code` varchar(6) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dms_user`
--

INSERT INTO `dms_user` (`user_id`, `profile_pic`, `user_email`, `password`, `Username`, `firstname`, `lastname`, `Contact_number`, `department_id`, `role`, `position`, `created_at`, `updated_at`, `status`, `is_verified`, `verification_token`, `verification_code`, `password_reset_code`, `password_reset_expires`) VALUES
(1, 'https://lh3.googleusercontent.com/a/ACg8ocIhpD_184y_Edc-9RJod2dRMKXfsKksA7Z1AKaWM-5lc7srqUFH=s96-c', 'polandreiladera03@gmail.com', '$2a$12$WbFadt88HuRbtzSOYx5giu7t6roL6dE68qFCccGUHeHuJT5kaGq06', 'ADMIN DEV.', 'ADMIN LAN', 'LAN', '09184226085', 1002, 'ADMIN', 'IT Support', '2025-09-07 03:34:43', '2025-11-11 23:47:50', 'active', 'yes', NULL, NULL, NULL, NULL),
(138, 'https://lh3.googleusercontent.com/a/ACg8ocLAErhOo11OOUho6ybHf4mhI7SRbqz8Zrd5rZp_6x7YwN2CLFdw=s96-c', 'marasiganhoneylee@gmail.com', '', 'Honey Lee Marasigan', '', '', NULL, 1000, 'ADMIN', 'IT Support', '2025-10-12 06:59:26', '2025-10-21 20:53:44', 'active', 'yes', NULL, NULL, NULL, NULL),
(140, 'https://lh3.googleusercontent.com/a/ACg8ocInYH-jR1J2gXLgGoO3kFnt0kUsWjBRw-4Qr_CNfj8KklKV5GM=s96-c', 'kaelgiongan@gmail.com', '$2b$12$kSO1SBaiGlamKIOx/T6Y6uPb8QMAT5f3Bcsqwb2747i3mSvsfT4m6', 'xenurryx', 'Kael', 'Gio', '09177428469', 1000, 'ADMIN', 'Administrator', '2025-10-13 02:12:19', '2025-10-21 03:56:59', 'active', 'yes', NULL, NULL, NULL, NULL),
(141, 'https://lh3.googleusercontent.com/a/ACg8ocKf72bFG-I8hFWQJT_IldNd88VfUcOvU6W8dLHEW809kL8rhtfJ=s96-c', 'merinpiolo9@gmail.com', '$2b$12$FEgCK5tPN8xjrFwjq4bCHuG4XroDByvxqieQ7JylPtC8J1btxGJbq', 'piolomerin', 'piolo', 'merin', '09919377602', 1000, 'ADMIN', 'IT Support', '2025-10-13 06:57:22', '2025-10-21 20:54:06', 'active', 'yes', NULL, NULL, NULL, NULL),
(142, 'https://lh3.googleusercontent.com/a/ACg8ocLEtatCeMtXksrYW6U6JJqP0yRA92tumSUftqgGPHQuMyX53FA=s96-c', 'victoriyaklauss03@gmail.com', '', 'Victoriya Visha Von Klauss', 'VIC', 'TORIYA', '09184226085', 1000, 'DEAN', 'Secretary', '2025-10-14 01:30:11', '2025-11-11 19:37:09', 'active', 'yes', NULL, NULL, NULL, NULL),
(144, 'https://lh3.googleusercontent.com/a/ACg8ocJgAiBETzRmatXaHQCEnhQAHqiISli8O_R1o7WzyaOC6LJFmXtg=s96-c', 'polsanjuanladera03@gmail.com', '', 'Pol Andrei L. Bulong', '', '', '', 1000, 'FACULTY', 'Faculty Member', '2025-10-14 05:56:15', '2025-10-20 20:47:31', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(145, 'https://lh3.googleusercontent.com/a/ACg8ocKoSapZ_nefsR4f8_3_B-6xL3a2CEDmJ8hz6SlyR8R75ZO4TkzO=s96-c', 'jgbulatao21@gmail.com', '', 'JENNILYN BULATAO', 'JENNILYN', 'BULATAO', '09392493025', 1002, 'ADMIN', 'Administrator', '2025-10-15 03:17:01', '2025-10-20 20:47:31', 'active', 'yes', NULL, NULL, NULL, NULL),
(146, 'https://lh3.googleusercontent.com/a/ACg8ocLV-XDgqUWjRyS9kVC_pJNkjOG7n6LJVcVeD7mWS9FDJ30CerUs=s96-c', 'mainlan03@gmail.com', '', 'Admin Lan', '', '', '', 1002, 'FACULTY', 'Assistant Professor', '2025-10-20 08:46:57', '2025-11-11 23:47:59', 'active', 'yes', NULL, NULL, NULL, NULL),
(147, 'https://lh3.googleusercontent.com/a/ACg8ocJFuFvGH9CDZSLK3f41nlhiQtW8daQ-A_bYCnKJXttyxxtNi14=s96-c', 'ispsctagudintest1141@gmail.com', '', 'ISPSC TAGUDIN', '', '', '', 6, 'DEAN', 'Dean', '2025-10-20 09:04:55', '2025-10-21 03:32:18', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(148, 'https://lh3.googleusercontent.com/a/ACg8ocJD7zSwV8LZldjAPoG0ScHqGQSUU3SBKq40nNtTe_uDUkwMJfw=s96-c', 'azannyx092@gmail.com', '', 'xenurryxII', '', '', '', 2, 'FACULTY', NULL, '2025-10-20 09:27:38', '2025-10-21 03:33:00', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(149, 'https://lh3.googleusercontent.com/a/ACg8ocLCtLZz7Zmt471wn_Ox2BYg5YUHStURu5kczNi_W3goIXHxvHw=s96-c', 'laderasanjuan03@gmail.com', '', 'Levv1', '', '', '', 4, 'FACULTY', 'Faculty Member', '2025-10-20 10:32:39', '2025-10-21 03:32:53', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(150, 'https://lh3.googleusercontent.com/a/ACg8ocKlkJrzO3ywFKCF2_Q_tthPQeYR7UlDyI2TTV6lkveqgaemlA=s96-c', 'apcreates07@gmail.com', '', 'AP creates', 'Aldwin', 'Panganiban', '09064780437', 1, 'FACULTY', 'Instructor', '2025-10-21 03:35:20', '2025-10-22 02:14:03', 'active', 'yes', NULL, NULL, NULL, NULL),
(151, 'https://lh3.googleusercontent.com/a/ACg8ocLjcKV3-AfP7xy2t4hp88R30ER6uOMbuubxioyx3_BfLxu_jMc=s96-c', 'beacarlben@gmail.com', '', 'Carlben Bea', '', '', '', 1, 'FACULTY', 'Instructor', '2025-10-21 03:45:22', '2025-10-21 20:54:32', 'active', 'yes', NULL, NULL, NULL, NULL),
(152, 'https://lh3.googleusercontent.com/a/ACg8ocLYSinyp3J36EjnfYYYIVtM8gZ4ckuUQxL6SAy2S1mCDue6tg=s96-c', 'tagudincampus@gmail.com', '', 'Tagudin Campus', '', '', NULL, 1002, 'ADMIN', 'Administrator', '2025-10-21 05:20:04', '2025-10-21 22:04:24', 'active', 'yes', NULL, NULL, NULL, NULL),
(153, NULL, 'abanizmaryrose7@gmail.com', '$2b$12$ySC4QXcWkbzaReQjiZh1temzOOJIOplwgwqIHMmk0.U1zusxx8rcm', 'MAROSE', 'MARY ROSE', 'ABANIZ', '09270251944', 2, 'DEAN', 'Secretary', '2025-10-21 07:27:44', '2025-10-21 07:31:36', 'active', 'yes', NULL, NULL, NULL, NULL),
(172, NULL, 'sminocensio@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'sminocensio', 'S.M', 'INOCENSIO', '09123456789', 1, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:39:32', 'active', 'yes', NULL, NULL, NULL, NULL),
(173, NULL, 'dvaldez@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'dvaldez', 'D', 'VALDEZ', '09123456790', 1, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:38:38', 'active', 'yes', NULL, NULL, NULL, NULL),
(174, 'https://i.imgur.com/YeJZBRK.png', 'kjtanyco@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'kjtanyco', 'K.J', 'TANYCO', '09123456791', 3, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-11 20:34:26', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(175, NULL, 'rgadingan@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'rgadingan', 'R', 'GADINGAN', '09123456792', 3, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:39:28', 'active', 'yes', NULL, NULL, NULL, NULL),
(176, NULL, 'jtablada@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'jtablada', 'J', 'TABLADA', '09123456793', 3, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:38:48', 'active', 'yes', NULL, NULL, NULL, NULL),
(177, NULL, 'mjgalay@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'mjgalay', 'M.J', 'GALAY', '09123456795', 6, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:39:23', 'active', 'yes', NULL, NULL, NULL, NULL),
(178, NULL, 'pa@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'pa', 'P', 'A', '09123456796', 6, 'FACULTY', 'Instructor', '2025-10-22 02:03:33', '2025-11-09 01:38:53', 'active', 'yes', NULL, NULL, NULL, NULL),
(179, NULL, 'mrgarica@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'mrgarica', 'M.R', 'GARICA', '09123456797', 1002, 'FACULTY', 'Nurse', '2025-10-22 02:03:33', '2025-11-09 01:40:59', 'active', 'yes', NULL, NULL, NULL, NULL),
(181, 'https://lh3.googleusercontent.com/a-/ALV-UjVuMeZ7p_a2OYXmrtgzUsOOQlc6Go1osYZw_Am-fK991XvG9OEYjbSRYhmBlnU2l2fsmhwtodv931qQYTpFiOSORRHHgUhPThkn5rryPsmyz5LdKBl18dc45HffNJrSJH2UaGeVPo67YPfIJOCTiHhg_NRxyk1cqHFPNSsaiSeBrefK0-6Vo1ySLmimy3FpveevwVAhZGYjSnR7PtcFAtWnD1q8B7cQjPvE_qmm0euZ_7ktcft0kPTp-BMTywRVyHiWmwvBOKX9rqQ1CZPS2AQVxxRcOraoHYaNte7ig6-eUxmcGVvmKTGyA4MwRGPw1s6ze9-mrkbfyNDjKAYSp1WKnU93y59dJkp-pLyE-evusyo1oFoPFMZ-9Y7-8Zek_2zX253LS1f3q3t1ZVNdLt6ldO_3CCBSRI4h1iMhiYD-PeXoKqE9RtPmd-Ial9RBc2QSHRHjDxTSTBR-dWPrD50QY001R_Gd-BFqOlbzfQiNNqPOm0hL1gJcsTM6H8pd_eshrtEc3mhUInX4xgI-cJsfTEKw4FxPSGCVHdK4qMV5M2KlH-PWhocjpzppX2nawQny7T1L-7lBbSnOzz4HO4i1E4ROph2p4CpRkMVWhN2yBfAq9RQ4W9vZszDfRsKCKJMdFtVCLhKQOOImJBuJ46mtRF5UVwpaeBF6vKI6LTtgTLfuEWyrRWHluv81gNN9STNTdJRcvMR_GaN-E2pbdxGhhC3iAcxMikKCODjRox9IyurX6SubMlmReGc1IDCPP5ZIC54b0ICLq6hPxsnDdxtpr8MMvuVfyHvyEjThcfwzJWXl_OAhQJioTJEn2V0x4EQ-t2yYtrQe7AbMjkQXQt-ZYGEqbG3BCNi25IZOW1B6KpTGE_6uXtSIG8fiTCk2JvZ9Xck_JniJ5qxr_n_LYiurTuMmMI2Y3Ykyqpozbr5nzfGBbPUF6TnVlDR_BgpIqug8uXZJp0M9FxRfJ6a2MzKtfsjn_raMNgvNnWkGRe0oL33b8g=s96-c', 'julren08@gmail.com', '', 'Caren Joy Ingoy', '', '', NULL, 1002, 'FACULTY', 'Cashier', '2025-10-22 06:14:18', '2025-10-22 06:32:23', 'active', 'yes', NULL, NULL, NULL, NULL),
(182, 'https://lh3.googleusercontent.com/a/ACg8ocKCY8W0Ia8GAizUWN4n7xMzFwii36oNxITHbF6fGAKNXFGHpblNoQ=s96-c', 'jericpadsing0321@gmail.com', '', 'Jeric Padsing', '', '', NULL, 2, 'FACULTY', 'Instructor', '2025-10-22 06:26:08', '2025-10-22 06:32:40', 'active', 'yes', NULL, NULL, NULL, NULL),
(183, 'https://lh3.googleusercontent.com/a/ACg8ocI54bwExJ4EFjCZeAo_8awKbo1KuMmpkBTvKzOD5PdYvzY-SQ=s96-c', 'tresmaniomarieolga@gmail.com', '', 'Olga Tresmanio', 'OLGA', 'TRESMANIO', '09666050842', 3, 'FACULTY', 'Associate Professor', '2025-10-22 06:57:37', '2025-10-22 07:01:09', 'active', 'yes', NULL, NULL, NULL, NULL),
(184, 'https://lh3.googleusercontent.com/a/ACg8ocLmhBx_S9YVQJFfgp1hnozyr-xoPZiIBY0gIh350jwAdHkj0g=s96-c', 'capstoneladera@gmail.com', '', 'capstone ladera', '', '', NULL, NULL, 'FACULTY', NULL, '2025-10-22 08:39:12', '2025-11-06 08:55:42', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(185, 'https://lh3.googleusercontent.com/a/ACg8ocIgkzoy1lghE9qyMQBWOOoBfgf0Sfov4N9iUF4wynP0CRg0YiY=s96-c', 'delosreyesjimmar@ispsc.edu.ph', '', 'jimjim', 'Jim-mar', 'de los Reyes', '09092165885', 1, 'FACULTY', 'Instructor', '2025-10-22 08:42:30', '2025-10-22 08:46:27', 'active', 'yes', NULL, NULL, NULL, NULL),
(186, 'https://i.imgur.com/YeJZBRK.png', 'carbonel.portugal@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'carbonelportugal', 'CARBONEL', 'PORTUGAL', '09123456794', 1, 'DEAN', NULL, '2025-10-20 10:32:39', '2025-11-11 07:12:37', 'active', 'yes', NULL, NULL, NULL, NULL),
(187, 'https://i.imgur.com/rthDwK6.png', 'kjtanyco@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'kjtanyco', 'K.J', 'TANYCO', '09123456791', 3, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(188, 'https://i.imgur.com/IJ0XY4O.png', 'rgadingan@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'rgadingan', 'R', 'GADINGAN', '09123456792', 3, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-11-11 20:34:49', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(189, 'https://i.imgur.com/9dAHRk6.png', 'jtablada@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'jtablada', 'J', 'TABLADA', '09123456793', 3, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-11-11 20:34:11', 'deleted', 'yes', NULL, NULL, NULL, NULL),
(190, 'https://i.imgur.com/qVlV7PQ.png', 'jamesoyando@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'jamesoyando', 'JAMES', 'OYANDO', '09123456794', 3, 'DEAN', NULL, '2025-10-20 10:32:39', '2025-11-11 07:13:08', 'active', 'yes', NULL, NULL, NULL, NULL),
(191, 'https://i.imgur.com/esoqCrY.png', 'leiannvillegas@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'leiannvillegas', 'LEI ANN', 'VILLEGAS', '09123456795', 4, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-11-11 20:35:22', 'active', 'yes', NULL, NULL, NULL, NULL),
(192, 'https://i.imgur.com/r5F2yu6.png', 'rheacortez@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'rheacortez', 'RHEA', 'CORTEZ', '09123456796', 2, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(193, 'https://i.imgur.com/CjyQ5O0.png', 'menorrichell@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'menorrichell', 'MENOR', 'RICHELL', '09123456797', 2, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(194, 'https://i.imgur.com/hqw5Nst.png', 'carlomanglioan@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'carlomanglioan', 'CARLO', 'MANGLIOAN', '09123456798', 2, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(195, 'https://i.imgur.com/zegmH78.png', 'mariadenise@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'mariadenise', 'MARIA', 'DENISE', '09123456799', 4, 'DEAN', 'Secretary', '2025-10-20 10:32:39', '2025-11-11 22:05:25', 'active', 'yes', NULL, NULL, NULL, NULL),
(196, 'https://i.imgur.com/OdNn6V3.png', 'reymarg@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'reymarg', 'REYMAR', 'G', '09123456800', 4, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-11-11 22:04:37', 'active', 'yes', NULL, NULL, NULL, NULL),
(197, 'https://i.imgur.com/ZMhF0SD.png', 'claireantoneete@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'claireantoneete', 'CLAIRE', 'ANTONEETE', '09123456801', 4, 'DEAN', 'Secretary', '2025-10-20 10:32:39', '2025-11-11 20:35:49', 'active', 'yes', NULL, NULL, NULL, NULL),
(198, 'https://i.imgur.com/MnE7tkW.png', 'rtenocgemalyn@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'rtenocgemalyn', 'RTENOC', 'GEMALYN', '09123456802', 4, 'DEAN', 'Principal', '2025-10-20 10:32:39', '2025-11-11 22:04:21', 'active', 'yes', NULL, NULL, NULL, NULL),
(199, 'https://i.imgur.com/GdufXPv.png', 'mjgalay@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'mjgalay', 'M.J', 'GALAY', '09123456803', 6, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(200, 'https://i.imgur.com/YeJZBRK.png', 'maureenstaana@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'maureenstaana', 'MAUREEN', 'STA ANA', '09123456804', 6, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(201, 'https://i.imgur.com/rthDwK6.png', 'larrymostoles@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'larrymostoles', 'LARRY', 'MOSTOLES', '09123456805', 6, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(202, 'https://i.imgur.com/IJ0XY4O.png', 'imeldabinayan@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'imeldabinayan', 'IMELDA', 'BINAYAN', '09123456806', 6, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(203, 'https://i.imgur.com/9dAHRk6.png', 'gemmasomera@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'gemmasomera', 'GEMMA', 'SOMERA', '09123456807', 6, 'FACULTY', 'Instructor', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(204, 'https://i.imgur.com/qVlV7PQ.png', 'izralatiw@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'izralatiw', 'IZRA', 'LATIW', '09123456808', 1002, 'DEAN', NULL, '2025-10-20 10:32:39', '2025-11-11 07:13:35', 'active', 'yes', NULL, NULL, NULL, NULL),
(205, 'https://i.imgur.com/esoqCrY.png', 'franjo@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'franjo', 'FRANJO', '', '09123456809', 1001, 'DEAN', 'Student Officer', '2025-10-20 10:32:39', '2025-11-11 20:41:05', 'active', 'yes', NULL, NULL, NULL, NULL),
(206, 'https://i.imgur.com/r5F2yu6.png', 'victor@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'victor', 'VICTOR', '', '09123456810', 1001, 'FACULTY', 'Student Officer', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(207, 'https://i.imgur.com/CjyQ5O0.png', 'nishren@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'nishren', 'NISHREN', '', '09123456811', 1001, 'FACULTY', 'Student Officer', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL),
(208, 'https://i.imgur.com/hqw5Nst.png', 'josepmurao@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'josepmurao', 'JOSE P', 'MURAO', '09123456812', 1001, 'FACULTY', 'Student Officer', '2025-10-20 10:32:39', '2025-11-11 20:40:58', 'active', 'yes', NULL, NULL, NULL, NULL),
(209, 'https://i.imgur.com/zegmH78.png', 'junlimadrid@gmail.com', '$2a$12$vs6TOTfz.3C1LlK1HyQNdeo19vBIrnDbH8mmAcXGtVym13QrV1HPu', 'junlimadrid', 'JUNLI P', 'MADRID', '09123456813', 1001, 'FACULTY', 'Student Officer', '2025-10-20 10:32:39', '2025-10-20 10:33:39', 'active', 'yes', NULL, NULL, NULL, NULL);

--
-- Triggers `dms_user`
--
DELIMITER $$
CREATE TRIGGER `set_first_user_as_admin` BEFORE INSERT ON `dms_user` FOR EACH ROW BEGIN
    DECLARE user_count INT DEFAULT 0;
    
    -- Check if this is the first user being created
    SELECT COUNT(*) INTO user_count FROM dms_user;
    
    -- If this is the first user (user_count = 0), make them ADMIN
    IF user_count = 0 THEN
        SET NEW.role = 'ADMIN';
        SET NEW.is_verified = 'yes';
        SET NEW.status = 'active';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `set_initial_user_status` BEFORE INSERT ON `dms_user` FOR EACH ROW BEGIN
    IF NEW.is_verified = 'yes' THEN
        SET NEW.status = 'active';
    ELSE
        SET NEW.status = 'pending';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_user_status_on_verification` BEFORE UPDATE ON `dms_user` FOR EACH ROW BEGIN
    -- Only update status if is_verified is being changed and status is not being explicitly set
    IF NEW.is_verified != OLD.is_verified THEN
        IF NEW.is_verified = 'yes' AND OLD.is_verified = 'no' THEN
            SET NEW.status = 'active';
        ELSEIF NEW.is_verified = 'no' AND OLD.is_verified = 'yes' THEN
            SET NEW.status = 'pending';
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `document_actions`
--

CREATE TABLE `document_actions` (
  `document_action_id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `action_id` int(11) NOT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `assigned_to_role` enum('ADMIN','DEAN','FACULTY') DEFAULT NULL,
  `assigned_to_department_id` int(11) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `completed_by_user_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by_user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_departments`
--

CREATE TABLE `document_departments` (
  `doc_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_departments`
--

INSERT INTO `document_departments` (`doc_id`, `department_id`) VALUES
(12, 1002),
(13, 1002),
(14, 1002),
(15, 1002),
(16, 1002);

-- --------------------------------------------------------

--
-- Table structure for table `document_folders`
--

CREATE TABLE `document_folders` (
  `id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `folder_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_roles`
--

CREATE TABLE `document_roles` (
  `doc_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

CREATE TABLE `document_types` (
  `type_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`type_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(5, 'Letter', NULL, '2025-09-29 00:02:46', '2025-09-29 00:02:46'),
(999, 'Unassigned', 'Default type for documents with deleted document types', '2025-09-30 02:34:44', '2025-09-30 02:34:44'),
(1002, 'Travel Order', '', '2025-10-13 02:39:07', '2025-10-13 02:39:07'),
(1003, 'Certificate', '', '2025-10-13 02:41:49', '2025-10-13 02:41:49'),
(1004, 'Application For Leave', '', '2025-10-13 02:58:15', '2025-10-13 02:58:15'),
(1006, 'Endorsement Letter', '', '2025-10-13 03:13:00', '2025-10-13 03:13:00'),
(1007, 'Attendance', '', '2025-10-13 07:00:56', '2025-10-13 07:00:56'),
(1008, 'Memo', '', '2025-10-14 02:34:13', '2025-10-14 02:34:13'),
(1009, 'Manual', '', '2025-10-16 10:31:12', '2025-10-16 10:31:12'),
(1010, 'Terms & Condition', '', '2025-10-16 10:36:25', '2025-10-16 10:36:25'),
(1011, 'Policy', '', '2025-10-16 10:54:35', '2025-10-16 10:54:35');

-- --------------------------------------------------------

--
-- Table structure for table `document_users`
--

CREATE TABLE `document_users` (
  `doc_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `folders`
--

CREATE TABLE `folders` (
  `folder_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `folders`
--

INSERT INTO `folders` (`folder_id`, `name`, `created_at`, `updated_at`) VALUES
(999, 'Unassigned', '2025-09-30 02:34:44', '2025-09-30 02:34:44'),
(1004, 'Memos From The Office Of The President', '2025-10-14 02:19:20', '2025-11-11 23:26:43'),
(1005, 'For Users', '2025-10-16 10:31:25', '2025-10-16 10:31:25'),
(1007, 'Others', '2025-10-22 06:44:00', '2025-10-22 06:44:00');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('added','updated','deleted','requested','replied') NOT NULL,
  `visible_to_all` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `related_doc_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `title`, `message`, `type`, `visible_to_all`, `created_at`, `related_doc_id`) VALUES
(1, 'New Document Added: Office Memo No. O-71, S. 2025', 'A new document \"Office Memo No. O-71, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 1),
(2, 'New Document Added: Office Memo No. O-79, S. 2025', 'A new document \"Office Memo No. O-79, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 2),
(3, 'New Document Added: Office Memo No. O-80, S. 2025', 'A new document \"Office Memo No. O-80, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 3),
(4, 'New Document Added: Office Memo No. O-82, S. 2025', 'A new document \"Office Memo No. O-82, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 4),
(5, 'New Document Added: Office Memo No. O-83, S. 2025', 'A new document \"Office Memo No. O-83, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 5),
(6, 'New Document Added: Office Memo No. O-86, S. 2025', 'A new document \"Office Memo No. O-86, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 6),
(7, 'New Document Added: Office Memo No. O-93, S. 2025', 'A new document \"Office Memo No. O-93, S. 2025\" has been uploaded by JENNILYN BULATAO', 'added', 1, '2025-11-11 23:35:29', 7),
(8, 'New Document Added: Office Memorandum No: 0-59, S. 2025', 'A new document \"Office Memorandum No: 0-59, S. 2025\" has been uploaded by ADMIN DEV.', 'added', 1, '2025-11-11 23:40:45', 8),
(9, 'New Document Added: Office Memorandum No .:0-55, S. 2025', 'A new document \"Office Memorandum No .:0-55, S. 2025\" has been uploaded by ADMIN DEV.', 'added', 1, '2025-11-11 23:40:45', 9),
(10, 'New Document Added: Office Memorandum No .:0-61, S. 2025', 'A new document \"Office Memorandum No .:0-61, S. 2025\" has been uploaded by ADMIN DEV.', 'added', 1, '2025-11-11 23:40:45', 10),
(11, 'New Document Added: Office Memorandum No.: 0-57, S. 2025', 'A new document \"Office Memorandum No.: 0-57, S. 2025\" has been uploaded by ADMIN DEV.', 'added', 1, '2025-11-11 23:40:45', 11),
(12, 'New Document Added: Office Memorandum No.: 0-56, S. 2025', 'A new document \"Office Memorandum No.: 0-56, S. 2025\" has been uploaded by IZRA LATIW', 'added', 0, '2025-11-11 23:46:46', 12),
(13, 'New Document Added: Office Memorandum No.: 0-52, S, 2025', 'A new document \"Office Memorandum No.: 0-52, S, 2025\" has been uploaded by IZRA LATIW', 'added', 0, '2025-11-11 23:46:46', 13),
(14, 'New Document Added: Office Memorandum No.: 0-53, S. 2025', 'A new document \"Office Memorandum No.: 0-53, S. 2025\" has been uploaded by IZRA LATIW', 'added', 0, '2025-11-11 23:46:46', 14),
(15, 'New Document Added: Office Memorandum No.: 0-58, S. 2025', 'A new document \"Office Memorandum No.: 0-58, S. 2025\" has been uploaded by IZRA LATIW', 'added', 0, '2025-11-11 23:46:46', 15),
(16, 'New Document Added: Office Memorandum No.: 0-74, S. 2025', 'A new document \"Office Memorandum No.: 0-74, S. 2025\" has been uploaded by IZRA LATIW', 'added', 0, '2025-11-11 23:46:46', 16);

-- --------------------------------------------------------

--
-- Table structure for table `notification_departments`
--

CREATE TABLE `notification_departments` (
  `notification_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_reads`
--

CREATE TABLE `notification_reads` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_roles`
--

CREATE TABLE `notification_roles` (
  `notification_id` int(11) NOT NULL,
  `role` enum('ADMIN','DEAN','FACULTY') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_users`
--

CREATE TABLE `notification_users` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `others`
--

CREATE TABLE `others` (
  `other_id` int(11) NOT NULL,
  `other_name` varchar(255) NOT NULL,
  `category` enum('ICON','MANUAL','POLICY','TERMS','INFO') NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `updated_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `others`
--

INSERT INTO `others` (`other_id`, `other_name`, `category`, `link`, `created_by_user_id`, `updated_by_user_id`, `created_at`, `updated_at`) VALUES
(1, 'ICON_1', 'ICON', 'https://i.imgur.com/YeJZBRK.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:57:11'),
(2, 'ICON_2', 'ICON', 'https://i.imgur.com/rthDwK6.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(3, 'ICON_3', 'ICON', 'https://i.imgur.com/IJ0XY4O.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(4, 'ICON_4', 'ICON', 'https://i.imgur.com/9dAHRk6.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(5, 'ICON_5', 'ICON', 'https://i.imgur.com/qVlV7PQ.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(6, 'ICON_6', 'ICON', 'https://i.imgur.com/esoqCrY.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(7, 'ICON_7', 'ICON', 'https://i.imgur.com/r5F2yu6.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(8, 'ICON_8', 'ICON', 'https://i.imgur.com/CjyQ5O0.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(9, 'ICON_9', 'ICON', 'https://i.imgur.com/hqw5Nst.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(10, 'ICON_10', 'ICON', 'https://i.imgur.com/zegmH78.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(11, 'ICON_11', 'ICON', 'https://i.imgur.com/OdNn6V3.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(12, 'ICON_12', 'ICON', 'https://i.imgur.com/ZMhF0SD.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(13, 'ICON_13', 'ICON', 'https://i.imgur.com/MnE7tkW.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(14, 'ICON_14', 'ICON', 'https://i.imgur.com/GdufXPv.png', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 00:56:12'),
(15, 'USER & MAINTENANCE MANUAL', 'MANUAL', 'https://docs.google.com/document/d/e/2PACX-1vQnSUQBOQjYw_J0Jx1QLVTGH0KKxWOn4_XXvFkYjQhJ5EY4uUsRtVeXw1OlE7xvFw/pub', NULL, NULL, '2025-10-05 23:57:16', '2025-10-06 01:19:36'),
(16, 'PRIVACY POLICY', 'POLICY', 'https://docs.google.com/document/d/176P3Zt5Oa57zzcK_L41Yf7oL0GFLGYWaGaFGJg3l56o/edit?usp=sharing', NULL, NULL, '2025-10-05 23:57:16', '2025-10-05 23:57:16'),
(17, 'TERMS & CONDITIONS', 'TERMS', 'https://docs.google.com/document/d/16NjJI5X69m0wcCv33NK5VP2oEm3rnqVwDoQqfx_ZZn0/edit?usp=drive_link', NULL, NULL, '2025-10-05 23:57:16', '2025-10-05 23:57:16'),
(18, 'CONTACT', 'INFO', 'polandreiladera03@gmail.com', NULL, NULL, '2025-10-05 23:57:16', '2025-10-05 23:57:16'),
(19, 'FACEBOOK', 'INFO', 'https://facebook.com/ispsc', NULL, NULL, '2025-10-06 02:37:39', '2025-10-06 02:37:39'),
(20, 'TWITTER', 'INFO', 'https://twitter.com/ispsc', NULL, NULL, '2025-10-06 02:37:39', '2025-10-06 02:37:39'),
(21, 'INSTAGRAM', 'INFO', 'https://instagram.com/ispsc', NULL, NULL, '2025-10-06 02:37:39', '2025-10-06 02:37:39'),
(23, 'MESSENGER/CONTACT', 'INFO', 'https://m.me/polandrei.ladera/', NULL, NULL, '2025-10-14 07:18:27', '2025-10-14 07:18:27');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `position_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `role_type` enum('ADMIN','DEAN','FACULTY','ALL') DEFAULT 'ALL',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`position_id`, `name`, `description`, `role_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'System administrator', 'ADMIN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(2, 'Developer', 'Software developer', 'ADMIN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(3, 'IT Support', 'Technical support staff', 'ADMIN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(4, 'Dean', 'Head of college/department', 'DEAN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(5, 'Assistant Dean', 'Assistant to the dean', 'DEAN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(6, 'Secretary', 'Administrative secretary', 'DEAN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(7, 'Department Head', 'Head of department', 'DEAN', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(8, 'Faculty Member', 'Teaching faculty', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(9, 'Professor', 'Full professor', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(10, 'Associate Professor', 'Associate professor', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(11, 'Assistant Professor', 'Assistant professor', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(12, 'Instructor', 'Instructor', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(13, 'Program Coordinator', 'Program coordinator', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(14, 'Research Coordinator', 'Research coordinator', 'FACULTY', 1, '2025-10-20 21:18:41', '2025-10-20 21:18:41'),
(15, 'Principal', 'In charge of Laboratory High School', 'DEAN', 1, '2025-10-20 21:45:41', '2025-10-20 21:45:41'),
(16, 'Cashier', 'works at the cashier', 'FACULTY', 1, '2025-10-22 02:09:51', '2025-10-22 02:09:51'),
(17, 'Nurse', 'Nurse Office', 'FACULTY', 1, '2025-10-22 02:13:01', '2025-10-22 02:13:01'),
(18, 'Student Officer', 'ssc', 'ALL', 1, '2025-11-11 20:40:43', '2025-11-11 20:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `subscription_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription_data` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `push_subscriptions`
--

INSERT INTO `push_subscriptions` (`subscription_id`, `user_id`, `subscription_data`, `created_at`, `updated_at`) VALUES
(1, 142, '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/dyT-9KNmBGI:APA91bEG2p-_5SM2kpiniK8x7NIVF4sSACbBGZx01T2iZ-NIme4QxI4dwi8l0qfr__r8vKtNOTyuhJUOOVg2_LiEuOi2qpyAaTna21O6zSVMPluGXb1DajLuuzAZiDX9lhABr0bhkpJq\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BEtDftc1I3kC1uEMB9zgtIo2WUT5pntXhrAl8UiCpJulPXXxppgcLwlkZ1EkgAguplKaN1eLt9KJTXOJK5W7Y4s\",\"auth\":\"CDsMA_CrNVdY5IlPZ-IhQA\"}}', '2025-10-20 16:49:59', '2025-10-22 03:03:49'),
(67, 146, '{\"endpoint\":\"https://wns2-bl2p.notify.windows.com/w/?token=BQYAAACxpPG0sS%2fsaSNUPJKCarAj8TD8DxiPUDbIx2FhG8YK%2fWTf2Pexb6eNC3MH%2fR5rZqd%2b3R7JTOgS%2fRCjCO1opkKb1myjtSFVisafCXIHQVGYPttY8gHRR5iBhgE26B3LxUO42VNK6Scrm8PYbt8dFXWzeFM6ZceNN43QnOMF3PiwQYQNCADJBweGAy0giRJzliXCcxgnoF9sH95cLLiT7Cny9YUfS2isq17FZu4ITyI9KIn2mrctzphzxjrQoUfSkrujqhZz5VYCi8ZF5ysjXe5srPsqmm78gJ7xEIK47bz%2bJYoPkL6szYpkDznjGB52j%2fCm4uzupe2uHBV4lB823umi\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BJpLGvCdgZ4JgoyfBtHimZTrYq4OsyBHgUDUNGerQOJBlHvQICbo3vK5jpumN_lIzdjbe8IMNLtf3F-ILmjicSo\",\"auth\":\"iDIJ4lBikSvyASP4-LMvjQ\"}}', '2025-10-22 03:10:46', '2025-10-22 03:10:46');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `maintenance_mode` tinyint(1) NOT NULL DEFAULT 0,
  `maintenance_message` text DEFAULT NULL,
  `maintenance_start_time` datetime DEFAULT NULL,
  `maintenance_end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `maintenance_mode`, `maintenance_message`, `maintenance_start_time`, `maintenance_end_time`, `created_at`, `updated_at`) VALUES
(1, 0, 'nnm', NULL, NULL, '2025-10-06 09:28:56', '2025-10-13 07:22:38');

-- --------------------------------------------------------

--
-- Table structure for table `user_document_preferences`
--

CREATE TABLE `user_document_preferences` (
  `preference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `is_favorite` tinyint(1) DEFAULT 0,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `action_required`
--
ALTER TABLE `action_required`
  ADD PRIMARY KEY (`action_id`),
  ADD KEY `idx_action_category` (`action_category`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_publish_at` (`publish_at`),
  ADD KEY `idx_expire_at` (`expire_at`);

--
-- Indexes for table `announcement_departments`
--
ALTER TABLE `announcement_departments`
  ADD PRIMARY KEY (`announcement_id`,`department_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `announcement_roles`
--
ALTER TABLE `announcement_roles`
  ADD PRIMARY KEY (`announcement_id`,`role`),
  ADD KEY `role` (`role`);

--
-- Indexes for table `announcement_users`
--
ALTER TABLE `announcement_users`
  ADD PRIMARY KEY (`announcement_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `dms_documents`
--
ALTER TABLE `dms_documents`
  ADD PRIMARY KEY (`doc_id`),
  ADD KEY `idx_doc_type` (`doc_type`),
  ADD KEY `idx_title` (`title`),
  ADD KEY `idx_available_copy` (`available_copy`),
  ADD KEY `idx_received_by_user_id` (`received_by_user_id`),
  ADD KEY `idx_visible_to_all` (`visible_to_all`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_deleted` (`deleted`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_deleted_by_name` (`deleted_by_name`),
  ADD KEY `dms_documents_ibfk_reply` (`is_reply_to_doc_id`),
  ADD KEY `idx_folder_id` (`folder_id`),
  ADD KEY `dms_documents_ibfk_created_by` (`created_by_user_id`),
  ADD KEY `idx_subject` (`subject`);

--
-- Indexes for table `dms_user`
--
ALTER TABLE `dms_user`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `dms_user_ibfk_department` (`department_id`),
  ADD KEY `idx_password_reset` (`user_email`,`password_reset_code`,`password_reset_expires`),
  ADD KEY `idx_dms_user_position` (`position`);

--
-- Indexes for table `document_actions`
--
ALTER TABLE `document_actions`
  ADD PRIMARY KEY (`document_action_id`),
  ADD KEY `idx_doc_id` (`doc_id`),
  ADD KEY `idx_action_id` (`action_id`),
  ADD KEY `idx_assigned_to_user_id` (`assigned_to_user_id`),
  ADD KEY `idx_assigned_to_role` (`assigned_to_role`),
  ADD KEY `idx_assigned_to_department_id` (`assigned_to_department_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_completed_by_user_id` (`completed_by_user_id`),
  ADD KEY `idx_created_by_user_id` (`created_by_user_id`);

--
-- Indexes for table `document_departments`
--
ALTER TABLE `document_departments`
  ADD KEY `document_departments_ibfk_doc` (`doc_id`),
  ADD KEY `document_departments_ibfk_department` (`department_id`);

--
-- Indexes for table `document_folders`
--
ALTER TABLE `document_folders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_doc_folder_pair` (`doc_id`,`folder_id`),
  ADD KEY `idx_doc` (`doc_id`),
  ADD KEY `idx_folder` (`folder_id`);

--
-- Indexes for table `document_roles`
--
ALTER TABLE `document_roles`
  ADD KEY `document_roles_ibfk_doc` (`doc_id`);

--
-- Indexes for table `document_types`
--
ALTER TABLE `document_types`
  ADD PRIMARY KEY (`type_id`),
  ADD UNIQUE KEY `uniq_document_types_name` (`name`);

--
-- Indexes for table `document_users`
--
ALTER TABLE `document_users`
  ADD KEY `document_users_ibfk_doc` (`doc_id`),
  ADD KEY `document_users_ibfk_user` (`user_id`);

--
-- Indexes for table `folders`
--
ALTER TABLE `folders`
  ADD PRIMARY KEY (`folder_id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `uniq_folders_name` (`name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_visible_to_all` (`visible_to_all`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_related_doc_id` (`related_doc_id`);

--
-- Indexes for table `notification_departments`
--
ALTER TABLE `notification_departments`
  ADD PRIMARY KEY (`notification_id`,`department_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_nd_notif` (`notification_id`),
  ADD KEY `idx_nd_dept` (`department_id`);

--
-- Indexes for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD PRIMARY KEY (`notification_id`,`user_id`),
  ADD UNIQUE KEY `uq_notification_reads` (`notification_id`,`user_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `notification_roles`
--
ALTER TABLE `notification_roles`
  ADD PRIMARY KEY (`notification_id`,`role`),
  ADD KEY `role` (`role`),
  ADD KEY `idx_nr_notif` (`notification_id`),
  ADD KEY `idx_nr_role` (`role`);

--
-- Indexes for table `notification_users`
--
ALTER TABLE `notification_users`
  ADD PRIMARY KEY (`notification_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_nu_notif` (`notification_id`),
  ADD KEY `idx_nu_user` (`user_id`);

--
-- Indexes for table `others`
--
ALTER TABLE `others`
  ADD PRIMARY KEY (`other_id`),
  ADD UNIQUE KEY `uq_others_category_name` (`category`,`other_name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `fk_others_created_by` (`created_by_user_id`),
  ADD KEY `fk_others_updated_by` (`updated_by_user_id`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`position_id`),
  ADD UNIQUE KEY `unique_position_name` (`name`),
  ADD KEY `idx_positions_role_type` (`role_type`),
  ADD KEY `idx_positions_is_active` (`is_active`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD UNIQUE KEY `unique_user_subscription` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_document_preferences`
--
ALTER TABLE `user_document_preferences`
  ADD PRIMARY KEY (`preference_id`),
  ADD UNIQUE KEY `uniq_user_doc_pref` (`user_id`,`doc_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `doc_id` (`doc_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `action_required`
--
ALTER TABLE `action_required`
  MODIFY `action_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1003;

--
-- AUTO_INCREMENT for table `dms_documents`
--
ALTER TABLE `dms_documents`
  MODIFY `doc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=563;

--
-- AUTO_INCREMENT for table `dms_user`
--
ALTER TABLE `dms_user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT for table `document_actions`
--
ALTER TABLE `document_actions`
  MODIFY `document_action_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_folders`
--
ALTER TABLE `document_folders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_types`
--
ALTER TABLE `document_types`
  MODIFY `type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1012;

--
-- AUTO_INCREMENT for table `folders`
--
ALTER TABLE `folders`
  MODIFY `folder_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1008;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=992;

--
-- AUTO_INCREMENT for table `others`
--
ALTER TABLE `others`
  MODIFY `other_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `position_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `user_document_preferences`
--
ALTER TABLE `user_document_preferences`
  MODIFY `preference_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcement_departments`
--
ALTER TABLE `announcement_departments`
  ADD CONSTRAINT `announcement_departments_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcement_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE;

--
-- Constraints for table `announcement_roles`
--
ALTER TABLE `announcement_roles`
  ADD CONSTRAINT `announcement_roles_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE;

--
-- Constraints for table `announcement_users`
--
ALTER TABLE `announcement_users`
  ADD CONSTRAINT `announcement_users_ibfk_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcement_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `dms_documents`
--
ALTER TABLE `dms_documents`
  ADD CONSTRAINT `dms_documents_ibfk_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dms_documents_ibfk_doc_type` FOREIGN KEY (`doc_type`) REFERENCES `document_types` (`type_id`),
  ADD CONSTRAINT `dms_documents_ibfk_folder` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`folder_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dms_documents_ibfk_received_by` FOREIGN KEY (`received_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dms_documents_ibfk_reply` FOREIGN KEY (`is_reply_to_doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE SET NULL;

--
-- Constraints for table `dms_user`
--
ALTER TABLE `dms_user`
  ADD CONSTRAINT `dms_user_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL;

--
-- Constraints for table `document_actions`
--
ALTER TABLE `document_actions`
  ADD CONSTRAINT `document_actions_ibfk_action` FOREIGN KEY (`action_id`) REFERENCES `action_required` (`action_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_actions_ibfk_assigned_department` FOREIGN KEY (`assigned_to_department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `document_actions_ibfk_assigned_user` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `document_actions_ibfk_completed_by` FOREIGN KEY (`completed_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `document_actions_ibfk_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `document_actions_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE;

--
-- Constraints for table `document_departments`
--
ALTER TABLE `document_departments`
  ADD CONSTRAINT `document_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_departments_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE;

--
-- Constraints for table `document_roles`
--
ALTER TABLE `document_roles`
  ADD CONSTRAINT `document_roles_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE;

--
-- Constraints for table `document_users`
--
ALTER TABLE `document_users`
  ADD CONSTRAINT `document_users_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_doc` FOREIGN KEY (`related_doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_departments`
--
ALTER TABLE `notification_departments`
  ADD CONSTRAINT `notification_departments_ibfk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_departments_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD CONSTRAINT `nr_fk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nr_fk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_roles`
--
ALTER TABLE `notification_roles`
  ADD CONSTRAINT `notification_roles_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_users`
--
ALTER TABLE `notification_users`
  ADD CONSTRAINT `notification_users_ibfk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_users_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `others`
--
ALTER TABLE `others`
  ADD CONSTRAINT `fk_others_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_others_updated_by` FOREIGN KEY (`updated_by_user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_document_preferences`
--
ALTER TABLE `user_document_preferences`
  ADD CONSTRAINT `user_document_preferences_ibfk_doc` FOREIGN KEY (`doc_id`) REFERENCES `dms_documents` (`doc_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_document_preferences_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `dms_user` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
