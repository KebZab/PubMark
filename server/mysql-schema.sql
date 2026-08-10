CREATE DATABASE IF NOT EXISTS pubmark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pubmark;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(32) NULL,
  role ENUM('super_admin','admin','vendor','officer') NOT NULL DEFAULT 'vendor',
  department VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stalls (
  id CHAR(36) PRIMARY KEY, stall_name VARCHAR(255) NOT NULL, status ENUM('vacant','occupied','unavailable') NOT NULL DEFAULT 'vacant', owner_id CHAR(36) NULL, business_type VARCHAR(255) NOT NULL, section VARCHAR(100) NOT NULL, floor ENUM('1','2') NOT NULL DEFAULT '1', floor_area VARCHAR(100) NOT NULL, notes TEXT NULL, geometry JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stall_owner FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, stall_id CHAR(36) NOT NULL, business_name VARCHAR(255) NOT NULL, business_type VARCHAR(255) NOT NULL, contract_start DATE NOT NULL, contract_term_months INT NOT NULL, contract_end DATE NOT NULL, permit_path VARCHAR(1024) NULL, additional_file_path VARCHAR(1024) NULL, notes TEXT NULL, status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending', admin_remarks TEXT NULL, date_applied TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id), FOREIGN KEY (stall_id) REFERENCES stalls(id)
);
CREATE TABLE IF NOT EXISTS transfers (id CHAR(36) PRIMARY KEY, from_user_id CHAR(36) NOT NULL, to_user_id CHAR(36) NOT NULL, stall_id CHAR(36) NOT NULL, original_application_id CHAR(36) NOT NULL, status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, responded_at TIMESTAMP NULL, FOREIGN KEY (from_user_id) REFERENCES profiles(id), FOREIGN KEY (to_user_id) REFERENCES profiles(id), FOREIGN KEY (stall_id) REFERENCES stalls(id), FOREIGN KEY (original_application_id) REFERENCES applications(id));
CREATE TABLE IF NOT EXISTS termination_requests (id CHAR(36) PRIMARY KEY, type ENUM('account','contract') NOT NULL, vendor_id CHAR(36) NOT NULL, stall_id CHAR(36) NULL, reason TEXT NOT NULL, status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP NULL, FOREIGN KEY (vendor_id) REFERENCES profiles(id), FOREIGN KEY (stall_id) REFERENCES stalls(id));
CREATE TABLE IF NOT EXISTS violations (id CHAR(36) PRIMARY KEY, stall_id CHAR(36) NOT NULL, vendor_id CHAR(36) NULL, officer_id CHAR(36) NOT NULL, category VARCHAR(100) NOT NULL, description TEXT NOT NULL, status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open', remarks TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP NULL, FOREIGN KEY (stall_id) REFERENCES stalls(id), FOREIGN KEY (vendor_id) REFERENCES profiles(id), FOREIGN KEY (officer_id) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS violation_evidence (id CHAR(36) PRIMARY KEY, violation_id CHAR(36) NOT NULL, storage_path VARCHAR(1024) NOT NULL, file_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size BIGINT NOT NULL, uploaded_by CHAR(36) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE, FOREIGN KEY (uploaded_by) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS violation_requests (id CHAR(36) PRIMARY KEY, stall_id CHAR(36) NOT NULL, requested_by CHAR(36) NOT NULL, reason TEXT NOT NULL, status ENUM('pending','assigned','completed') NOT NULL DEFAULT 'pending', assigned_officer_id CHAR(36) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP NULL, FOREIGN KEY (stall_id) REFERENCES stalls(id), FOREIGN KEY (requested_by) REFERENCES profiles(id), FOREIGN KEY (assigned_officer_id) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS check_requests (id CHAR(36) PRIMARY KEY, stall_id CHAR(36) NOT NULL, requested_by CHAR(36) NOT NULL, assigned_to CHAR(36) NULL, priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal', reason TEXT NOT NULL, notes TEXT NULL, status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP NULL, completion_notes TEXT NULL, completion_summary TEXT NULL, FOREIGN KEY (stall_id) REFERENCES stalls(id), FOREIGN KEY (requested_by) REFERENCES profiles(id), FOREIGN KEY (assigned_to) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS check_request_files (id CHAR(36) PRIMARY KEY, check_request_id CHAR(36) NOT NULL, storage_path VARCHAR(1024) NOT NULL, file_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size BIGINT NOT NULL, uploaded_by CHAR(36) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (check_request_id) REFERENCES check_requests(id) ON DELETE CASCADE, FOREIGN KEY (uploaded_by) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS announcements (id CHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, type ENUM('info','warning','urgent','success') NOT NULL DEFAULT 'info', author_id CHAR(36) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (author_id) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS inventory_items (id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, unit VARCHAR(64) NOT NULL, quantity DECIMAL(12,2) NOT NULL DEFAULT 0, min_quantity DECIMAL(12,2) NOT NULL DEFAULT 0, unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0, supplier VARCHAR(255) NULL, last_restocked DATE NULL, notes TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS archive (id CHAR(36) PRIMARY KEY, type ENUM('application','vendor','stall','violation') NOT NULL, title VARCHAR(255) NOT NULL, description TEXT NULL, original_id CHAR(36) NOT NULL, original_data JSON NOT NULL, archived_by CHAR(36) NOT NULL, reason TEXT NULL, can_restore BOOLEAN NOT NULL DEFAULT TRUE, archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (archived_by) REFERENCES profiles(id));
CREATE TABLE IF NOT EXISTS market_perimeter (id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, geometry JSON NOT NULL, created_by CHAR(36) NOT NULL, notes TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (created_by) REFERENCES profiles(id));
