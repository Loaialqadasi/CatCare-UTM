-- ============================================
-- CatCare UTM — Full Database Setup
-- ============================================
-- Import this in phpMyAdmin:
--   1. Open phpMyAdmin
--   2. Click "Import" tab at the top
--   3. Choose this file (catcare-full-setup.sql)
--   4. Click "Go"
-- 
-- This will create the database, tables, and seed data all at once.
-- ============================================

CREATE DATABASE IF NOT EXISTS catcare_utm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catcare_utm;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS emergency_reports;
DROP TABLE IF EXISTS cats;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Users Table ───
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','volunteer','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Cats Table ───
CREATE TABLE cats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nickname VARCHAR(100) NOT NULL,
  description TEXT NULL,
  photo_url VARCHAR(500) NULL,
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  health_status ENUM('healthy','needs_attention','injured','unknown') NOT NULL DEFAULT 'unknown',
  ownership_tag ENUM('stray','adopted','campus_managed','unknown') NOT NULL DEFAULT 'unknown',
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cats_created_at (created_at),
  CONSTRAINT fk_cats_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Emergency Reports Table ───
CREATE TABLE emergency_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cat_id BIGINT UNSIGNED NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  emergency_type ENUM('injury','sickness','missing','feeding_urgent','danger','other') NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'high',
  status ENUM('open','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  reported_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_emergency_reports_status (status),
  KEY idx_emergency_reports_priority (priority),
  KEY idx_emergency_reports_created_at (created_at),
  KEY idx_emergency_reports_cat_id (cat_id),
  CONSTRAINT fk_emergency_reports_cat FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE SET NULL,
  CONSTRAINT fk_emergency_reports_reported_by FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed Data ───
-- Default password for all accounts: password123

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'admin'),
  ('Student User', 'student@graduate.utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'student');

INSERT INTO cats (nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id) VALUES
  ('Oyen Library', 'Friendly orange cat usually seen near the library.', 'https://placecats.com/millie/400/300', 'UTM Library', 1.5589000, 103.6389000, 'healthy', 'campus_managed', 2),
  ('Grey Canteen', 'Shy grey cat often near the cafeteria.', 'https://placecats.com/millie/400/300', 'UTM Cafeteria', 1.5600000, 103.6400000, 'needs_attention', 'stray', 2),
  ('Kucing Tepi Jalan', 'Black and white cat that hangs around the main road.', 'https://placecats.com/millie/400/300', 'UTM Main Road', 1.5595000, 103.6395000, 'healthy', 'stray', 2),
  ('Milo Dorm', 'Tabby cat adopted by students at the dormitory.', 'https://placecats.com/millie/400/300', 'UTM Dormitory Block A', 1.5610000, 103.6410000, 'healthy', 'adopted', 2),
  ('Putih Engineering', 'White cat with blue eyes near the engineering faculty.', 'https://placecats.com/millie/400/300', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 'injured', 'campus_managed', 2),
  ('Shadow Parking', 'Dark grey cat that lives in the parking area.', 'https://placecats.com/millie/400/300', 'UTM Parking Lot B', 1.5605000, 103.6405000, 'healthy', 'stray', 2),
  ('Ginger Mosque', 'Orange cat always sleeping near the mosque.', 'https://placecats.com/millie/400/300', 'UTM Mosque', 1.5598000, 103.6392000, 'needs_attention', 'campus_managed', 2),
  ('Bulat Sports', 'Round fluffy cat near the sports complex.', 'https://placecats.com/millie/400/300', 'UTM Sports Complex', 1.5602000, 103.6398000, 'healthy', 'stray', 2);

INSERT INTO emergency_reports (cat_id, title, description, emergency_type, priority, status, location_name, latitude, longitude, reported_by_user_id) VALUES
  (1, 'Injured cat near cafeteria', 'Cat appears to have an injured leg and needs urgent help.', 'injury', 'critical', 'open', 'UTM Cafeteria', 1.5600000, 103.6400000, 2),
  (2, 'Cat missing near dorm', 'Grey cat missing since last night, last seen near dorm entrance.', 'missing', 'high', 'in_progress', 'UTM Dorm Entrance', 1.5590000, 103.6370000, 2),
  (5, 'Injured white cat at engineering', 'The white cat near engineering faculty seems to have a cut on its paw.', 'injury', 'high', 'open', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 2),
  (7, 'Ginger cat not eating', 'The orange cat near the mosque has not been eating for 2 days.', 'sickness', 'medium', 'open', 'UTM Mosque', 1.5598000, 103.6392000, 2),
  (NULL, 'Stray kitten at parking lot', 'Found a small kitten alone at the parking lot, looks very young.', 'danger', 'critical', 'open', 'UTM Parking Lot B', 1.5605000, 103.6405000, 2),
  (3, 'Kucing Tepi Jalan needs food', 'The black and white cat near main road seems underweight.', 'feeding_urgent', 'medium', 'resolved', 'UTM Main Road', 1.5595000, 103.6395000, 2);
