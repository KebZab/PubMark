-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: pubmark
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','warning','urgent','success') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `author_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES ('13621daa-bb63-441c-bb38-5fbce8ccabc1','Welcome to Stall Management Portal','All stall applicants are reminded to submit complete documentation including business permit and valid ID. Incomplete applications will not be processed.','info','22222222-2222-4222-8222-222222222222','2026-08-12 06:50:49'),('23f45937-7af5-42e2-a8ce-8a724a857b98','ge','ge','info','22222222-2222-4222-8222-222222222222','2026-08-12 06:50:53'),('888ac7db-ec0a-4a9b-8fc5-cccadcde5ceb','New Stalls Available in Section B','We are pleased to announce that 8 new stalls in Section B are now open for applications. Visit the map to view their locations and submit your application.','success','22222222-2222-4222-8222-222222222222','2026-08-12 06:50:49'),('ccd11884-8444-491e-860d-5b3457a76be2','wawawqa','awaawaw','info','22222222-2222-4222-8222-222222222222','2026-08-12 06:51:12'),('d15571a0-ece3-4470-b91a-10b5a711852e','Deadline Reminder: May 15 Applications','Applications for Stalls A-101 to A-110 are due by May 15, 2026. Please ensure all required documents are uploaded before the deadline.','warning','22222222-2222-4222-8222-222222222222','2026-08-12 06:50:49');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_start` date NOT NULL,
  `contract_term_months` int NOT NULL,
  `contract_end` date NOT NULL,
  `permit_path` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_file_path` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_remarks` text COLLATE utf8mb4_unicode_ci,
  `date_applied` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `stall_id` (`stall_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES ('289602be-0dde-42ca-a307-173e5317b8d3','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','waw','General','2026-08-12',24,'2028-08-12','con1.jpg',NULL,'','rejected','[[PM_PERMIT_TERMINATED:2026-08-12T06:53:59.186Z]]\nContract terminated by admin approval.','2026-08-12 06:52:29'),('35b6b325-e69f-4ddb-b31b-505f40d180aa','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','lee','General','2026-08-12',12,'2027-08-12','con5.jpg',NULL,'asd','rejected','Contract terminated by admin approval.','2026-08-11 20:05:24'),('4ea4f7ae-b6db-45cf-899e-492e68d8d85a','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','bacolod','General','2026-08-12',24,'2028-08-12',NULL,NULL,'sada','rejected','Contract terminated by admin approval.','2026-08-12 05:52:07'),('aea3be77-752a-49ca-a573-147e770768cf','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heh','Electronics','2026-08-12',24,'2028-08-12','con1.jpg',NULL,'','rejected',NULL,'2026-08-12 05:39:02'),('d143106d-d1d8-46a2-a319-16041f733bf4','22af5e29-6539-471b-b48c-8cd751a402b4','a3ad88d5-d5e5-4286-980f-2bb59d99f595','wasda','Electronics','2026-08-12',12,'2027-08-12','con5.jpg',NULL,'wqsadadasd','approved',NULL,'2026-08-11 19:47:28');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archive`
--

DROP TABLE IF EXISTS `archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archive` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('application','vendor','stall','violation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `original_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_data` json NOT NULL,
  `archived_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `can_restore` tinyint(1) NOT NULL DEFAULT '1',
  `archived_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `archived_by` (`archived_by`),
  CONSTRAINT `archive_ibfk_1` FOREIGN KEY (`archived_by`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archive`
--

LOCK TABLES `archive` WRITE;
/*!40000 ALTER TABLE `archive` DISABLE KEYS */;
/*!40000 ALTER TABLE `archive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `check_request_files`
--

DROP TABLE IF EXISTS `check_request_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `check_request_files` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `check_request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(1024) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `check_request_id` (`check_request_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `check_request_files_ibfk_1` FOREIGN KEY (`check_request_id`) REFERENCES `check_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `check_request_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `check_request_files`
--

LOCK TABLES `check_request_files` WRITE;
/*!40000 ALTER TABLE `check_request_files` DISABLE KEYS */;
INSERT INTO `check_request_files` VALUES ('73629a80-c43e-4eee-b1bf-e85573af3b38','bd86fdce-f210-4bb1-b195-4872d67702ee','virtual://check-requests/bd86fdce-f210-4bb1-b195-4872d67702ee/con5.jpg','con5.jpg','image/*',314573,'44444444-4444-4444-8444-444444444444','2026-08-12 07:29:24');
/*!40000 ALTER TABLE `check_request_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `check_requests`
--

DROP TABLE IF EXISTS `check_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `check_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completion_notes` text COLLATE utf8mb4_unicode_ci,
  `completion_summary` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `stall_id` (`stall_id`),
  KEY `requested_by` (`requested_by`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `check_requests_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`),
  CONSTRAINT `check_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `profiles` (`id`),
  CONSTRAINT `check_requests_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `check_requests`
--

LOCK TABLES `check_requests` WRITE;
/*!40000 ALTER TABLE `check_requests` DISABLE KEYS */;
INSERT INTO `check_requests` VALUES ('3a911540-b6d3-453a-91c8-fc5f92f70b45','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('54a176a9-e717-4aa3-97ff-ef3c015b41c9','a3ad88d5-d5e5-4286-980f-2bb59d99f595','11111111-1111-4111-8111-111111111111',NULL,'high','pa check fliss','sbung','pending','2026-08-12 06:35:24',NULL,'',''),('74fbb74f-fb82-4da2-9933-4956698b520e','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('9f2c7516-6033-41cb-ab4a-6e5b219f3288','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('b0278cb0-f9ff-40aa-b5e5-35795a6922bf','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('bd86fdce-f210-4bb1-b195-4872d67702ee','a3ad88d5-d5e5-4286-980f-2bb59d99f595','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','normal','hehe','heh','completed','2026-08-12 07:03:52','2026-08-12 07:29:24','','m;l'),('bea0ff67-ff8a-4757-a6d6-3b0d03699a55','a3ad88d5-d5e5-4286-980f-2bb59d99f595','11111111-1111-4111-8111-111111111111',NULL,'high','pa check fliss','sbung','pending','2026-08-12 06:35:24',NULL,'',''),('ca16739c-d0c0-4de3-a59c-9c3c4bae4735','a3ad88d5-d5e5-4286-980f-2bb59d99f595','11111111-1111-4111-8111-111111111111',NULL,'high','pa check fliss','sbung','pending','2026-08-12 06:35:24',NULL,'',''),('d92f2cf6-05ac-46f6-a1e5-1b9eec7619aa','a3ad88d5-d5e5-4286-980f-2bb59d99f595','11111111-1111-4111-8111-111111111111',NULL,'high','pa check fliss','sbung','pending','2026-08-12 06:35:24',NULL,'',''),('dcbaa580-7c16-46bd-85be-f9022b4c4577','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('f1983e49-cb17-4dca-85c4-c2b3b45da233','e7db8d06-e51c-4ecf-be08-cbd80817da40','22222222-2222-4222-8222-222222222222',NULL,'normal','ww','awwa','pending','2026-08-12 06:54:55',NULL,'',''),('fa1fb81c-cde3-4bdf-af51-1d23cf5161e1','a3ad88d5-d5e5-4286-980f-2bb59d99f595','11111111-1111-4111-8111-111111111111',NULL,'high','pa check fliss','sbung','pending','2026-08-12 06:35:24',NULL,'','');
/*!40000 ALTER TABLE `check_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `min_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `supplier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_restocked` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `market_perimeter`
--

DROP TABLE IF EXISTS `market_perimeter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `market_perimeter` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `geometry` json NOT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `market_perimeter_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `market_perimeter`
--

LOCK TABLES `market_perimeter` WRITE;
/*!40000 ALTER TABLE `market_perimeter` DISABLE KEYS */;
INSERT INTO `market_perimeter` VALUES ('6e8ef3c0-1aef-4d48-b314-49ef359571b9','Market Perimeter','{\"type\": \"Polygon\", \"coordinates\": [[[123.041023, 10.605971], [123.04177, 10.605756], [123.041565, 10.605107], [123.040821, 10.605315], [123.041023, 10.605971]]]}','11111111-1111-4111-8111-111111111111','1','2026-08-11 19:26:53');
/*!40000 ALTER TABLE `market_perimeter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','admin','vendor','officer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vendor',
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES ('11111111-1111-4111-8111-111111111111','superadmin@pubmark.com','$2a$12$pSpvjMOj2n8A19lALgP2HOSMDxZFokaQ53G.vRNDITuDTHHjpABDS','Ricardo Magalona',NULL,NULL,'super_admin','Executive','2026-08-10 15:15:31','2026-08-10 15:15:31'),('22222222-2222-4222-8222-222222222222','admin@pubmark.com','$2a$12$m1mwVg0JrLJDmx0Jv7Y1T.ItRiUX/voG6bh7oQjKREMBesW5CcXyK','Admin',NULL,NULL,'admin','Market Administration','2026-08-10 15:15:32','2026-08-10 15:15:32'),('22af5e29-6539-471b-b48c-8cd751a402b4','lee@gmail.com','$2a$12$Bbw6rPA64OiCEw533mAFoeJSPaLIcOUWcsB2ejOh84gpWiSrelvPi','Lee Ruben Valero','maao','09123123123','vendor',NULL,'2026-08-11 19:47:04','2026-08-11 19:47:04'),('33333333-3333-4333-8333-333333333333','juan@example.com','$2a$12$g5HrdV6HIE5Q6zqRTrMGxeIkhsYw9PUQZHvZC2Lfvj6Ghl9GLb2ZS','Juan dela Cruz',NULL,NULL,'vendor',NULL,'2026-08-10 15:15:32','2026-08-10 15:15:32'),('44444444-4444-4444-8444-444444444444','officer@pubmark.com','$2a$12$tqnT24eVV5cBuePlTU0ld.uh1dQGwrNIB7xMOM1AYW1UeKVRb2zMi','Carlos Reyes',NULL,NULL,'officer','Market Enforcement','2026-08-10 15:15:32','2026-08-10 15:15:32'),('5102c744-90b3-4363-94bb-14658ccb1a9a','canet@gmail.com','$2a$12$zWeYEvYKaijPJoo8mGhywuPlEEq/ZzkCodMf29Y7GlSUg7Uz7hQFK','cj Canet','wata','09211212212','vendor',NULL,'2026-08-12 06:52:16','2026-08-12 06:52:16'),('a6e40893-3210-4723-bfcc-c6e08fbf1762','cj@gmail.com','$2a$12$wkyj3D8Cl2IhSormZc/W.eNzJXxDAlCMm0kPM.K6W.pR5jv.nWZbC','kevin','talisay','09671212121','vendor',NULL,'2026-08-11 17:14:57','2026-08-11 17:14:57'),('c53cc965-6c99-4fe2-bc8e-665a06efd778','kevin@gmail.com','$2a$12$IJHyFcYPler9yc0eyVCEMu3a23HJr/vjwfO7jSppZxn/X5DAxlHRy','kevin','murcia','09670949903','vendor',NULL,'2026-08-10 15:17:08','2026-08-10 15:17:08');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stalls`
--

DROP TABLE IF EXISTS `stalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stalls` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('vacant','occupied','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vacant',
  `owner_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` enum('1','2') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  `floor_area` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `geometry` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_stall_owner` (`owner_id`),
  CONSTRAINT `fk_stall_owner` FOREIGN KEY (`owner_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stalls`
--

LOCK TABLES `stalls` WRITE;
/*!40000 ALTER TABLE `stalls` DISABLE KEYS */;
INSERT INTO `stalls` VALUES ('a3ad88d5-d5e5-4286-980f-2bb59d99f595','stall','vacant',NULL,'General','A','1','103','hehe','{\"type\": \"Polygon\", \"coordinates\": [[[123.040925, 10.605552], [123.041064, 10.605518], [123.041045, 10.60546], [123.040913, 10.605495], [123.040925, 10.605552]]]}','2026-08-11 19:45:34'),('e7db8d06-e51c-4ecf-be08-cbd80817da40','stall','vacant',NULL,'General','A','1','74','hehe','{\"type\": \"Polygon\", \"coordinates\": [[[123.041065, 10.605519], [123.041175, 10.605485], [123.041159, 10.605443], [123.041045, 10.605463], [123.041065, 10.605519]]]}','2026-08-11 20:04:38');
/*!40000 ALTER TABLE `stalls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `termination_requests`
--

DROP TABLE IF EXISTS `termination_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `termination_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('account','contract') COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `stall_id` (`stall_id`),
  CONSTRAINT `termination_requests_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `termination_requests_ibfk_2` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `termination_requests`
--

LOCK TABLES `termination_requests` WRITE;
/*!40000 ALTER TABLE `termination_requests` DISABLE KEYS */;
INSERT INTO `termination_requests` VALUES ('06843935-9c62-45f9-a0b9-03023893ee4a','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','fge','approved','2026-08-12 05:54:25','2026-08-12 05:54:35'),('0ceedd86-000b-4fca-8742-4cd14ef053db','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heheh','approved','2026-08-12 05:34:06','2026-08-12 05:34:16'),('0d5c9c94-7cb2-4947-ac68-9d3cbb036674','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10'),('0e626f8a-f8a7-413a-adf7-1310f4e69a75','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('19903265-666a-4217-996f-8da3ac702cef','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10'),('1d50bb8c-e9fc-4e01-b420-881df54729dd','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','fge','approved','2026-08-12 05:54:25','2026-08-12 05:54:35'),('2bf06891-c7ba-46bf-99aa-be77b5a1f8bb','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('38b599e0-7e03-4520-b08f-ec2ac7493c86','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('39629a76-81db-4d40-8793-72512fb8423d','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','fge','approved','2026-08-12 05:54:25','2026-08-12 05:54:35'),('3ecbae30-6c03-434e-b713-158d45957aa5','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('71c345e3-2c48-483d-9834-ef98c08f7c43','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('748cce12-2238-4654-bc58-d65d0b212def','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('7a57341c-2777-44d6-9066-af069d8a6d9c','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('7b386441-c74e-4e4a-9585-bfd1a1625c2e','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('7bf52859-9d5d-455a-8660-7c29a2ab5ae5','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('7c09b925-c978-4275-99d4-968a164adc07','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','fge','approved','2026-08-12 05:54:25','2026-08-12 05:54:35'),('7ed747bd-4a1f-420d-bbd2-899a0038b891','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heheh','approved','2026-08-12 05:34:06','2026-08-12 05:34:16'),('866bbb02-7b36-4142-9c9e-5abb7bf23636','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heheh','approved','2026-08-12 05:34:06','2026-08-12 05:34:16'),('878f22c9-6937-4dd5-ba00-08022bd42597','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('a0c62e9a-6914-459d-9e5a-7f1b75db5553','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10'),('a6353cfc-fde5-4fa3-b422-b68d4536d95b','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heheh','approved','2026-08-12 05:34:06','2026-08-12 05:34:16'),('ac40ef99-b2cc-48e0-b44e-50fc147f0594','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','fge','approved','2026-08-12 05:54:25','2026-08-12 05:54:35'),('d4c60e87-5afc-45a2-9841-264adfa074ea','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','No reason provided','approved','2026-08-12 05:29:20','2026-08-12 05:29:33'),('d5b43e06-1847-4c8d-9ae8-2d9b054470a2','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','heheh','approved','2026-08-12 05:34:06','2026-08-12 05:34:16'),('df61f780-22f7-43d5-9852-e559f1039f4c','contract','5102c744-90b3-4363-94bb-14658ccb1a9a','e7db8d06-e51c-4ecf-be08-cbd80817da40','we','approved','2026-08-12 06:53:50','2026-08-12 06:53:59'),('e090271d-78d3-420d-a1aa-d26bf9e013ea','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10'),('f6761f8a-98f8-47d5-89d8-af46a745a531','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10'),('fb35775b-936a-4433-8029-88c7c94b4f47','contract','33333333-3333-4333-8333-333333333333','e7db8d06-e51c-4ecf-be08-cbd80817da40','hehe','approved','2026-08-12 05:28:52','2026-08-12 05:29:10');
/*!40000 ALTER TABLE `termination_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_application_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','accepted','declined') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `stall_id` (`stall_id`),
  KEY `original_application_id` (`original_application_id`),
  CONSTRAINT `transfers_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `transfers_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `transfers_ibfk_3` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`),
  CONSTRAINT `transfers_ibfk_4` FOREIGN KEY (`original_application_id`) REFERENCES `applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers`
--

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violation_evidence`
--

DROP TABLE IF EXISTS `violation_evidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violation_evidence` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `violation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(1024) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `violation_id` (`violation_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `violation_evidence_ibfk_1` FOREIGN KEY (`violation_id`) REFERENCES `violations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `violation_evidence_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violation_evidence`
--

LOCK TABLES `violation_evidence` WRITE;
/*!40000 ALTER TABLE `violation_evidence` DISABLE KEYS */;
/*!40000 ALTER TABLE `violation_evidence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violation_requests`
--

DROP TABLE IF EXISTS `violation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violation_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','assigned','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `assigned_officer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stall_id` (`stall_id`),
  KEY `requested_by` (`requested_by`),
  KEY `assigned_officer_id` (`assigned_officer_id`),
  CONSTRAINT `violation_requests_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`),
  CONSTRAINT `violation_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `profiles` (`id`),
  CONSTRAINT `violation_requests_ibfk_3` FOREIGN KEY (`assigned_officer_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violation_requests`
--

LOCK TABLES `violation_requests` WRITE;
/*!40000 ALTER TABLE `violation_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `violation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violations`
--

DROP TABLE IF EXISTS `violations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `officer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','resolved','dismissed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stall_id` (`stall_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `officer_id` (`officer_id`),
  CONSTRAINT `violations_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`id`),
  CONSTRAINT `violations_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `violations_ibfk_3` FOREIGN KEY (`officer_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violations`
--

LOCK TABLES `violations` WRITE;
/*!40000 ALTER TABLE `violations` DISABLE KEYS */;
INSERT INTO `violations` VALUES ('1ba9c2b5-da28-415b-bf48-da046c4eab62','a3ad88d5-d5e5-4286-980f-2bb59d99f595',NULL,'44444444-4444-4444-8444-444444444444','Health Violation','wala kabayad','open','check','2026-08-12 06:34:46',NULL),('27e09dde-0190-4c4a-b7de-c0e0ac499861','a3ad88d5-d5e5-4286-980f-2bb59d99f595',NULL,'44444444-4444-4444-8444-444444444444','Health Violation','wala kabayad','open','check','2026-08-12 06:34:46',NULL),('62235fa0-8476-46b9-b118-e8906bc7c3ae','a3ad88d5-d5e5-4286-980f-2bb59d99f595',NULL,'44444444-4444-4444-8444-444444444444','Health Violation','wala kabayad','open','check','2026-08-12 06:34:46',NULL),('7a131a8a-b4f4-4d0e-b82c-664e9432c706','a3ad88d5-d5e5-4286-980f-2bb59d99f595',NULL,'44444444-4444-4444-8444-444444444444','Health Violation','wala kabayad','open','check','2026-08-12 06:34:46',NULL),('f34a3880-73cf-4f00-9e2b-f9599a8744c7','a3ad88d5-d5e5-4286-980f-2bb59d99f595',NULL,'44444444-4444-4444-8444-444444444444','Health Violation','wala kabayad','open','check','2026-08-12 06:34:46',NULL);
/*!40000 ALTER TABLE `violations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'pubmark'
--

--
-- Dumping routines for database 'pubmark'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-12 16:15:27
