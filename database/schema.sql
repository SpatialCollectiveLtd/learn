-- Spatial Collective Learning Platform Database Schema
-- Generated: November 21, 2025

-- ============================================
-- MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE KEY unique_module_slug (module_id, slug),
  INDEX idx_module_active (module_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRAINING SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_type ENUM('text', 'checklist', 'steps', 'warning', 'tip', 'code') DEFAULT 'text',
  content LONGTEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  parent_section_id INT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  estimated_time INT DEFAULT 0 COMMENT 'Estimated time in minutes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_section_id) REFERENCES training_sections(id) ON DELETE CASCADE,
  INDEX idx_role_order (role_id, display_order),
  INDEX idx_parent (parent_section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USERS TABLE (For future authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('employee', 'trainer', 'admin') DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER PROGRESS TABLE (For future tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  section_id INT NOT NULL,
  completed_at TIMESTAMP NULL,
  notes TEXT,
  time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES training_sections(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_section (user_id, section_id),
  INDEX idx_user (user_id),
  INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA: MODULES
-- ============================================
INSERT INTO modules (name, slug, description, icon, display_order) VALUES
('Digitization', 'digitization', 'Digital mapping and satellite image interpretation', '🗺️', 1),
('Mobile Mapping', 'mobile-mapping', 'Field data collection using mobile devices', '📱', 2),
('Household Survey', 'household-survey', 'Conducting comprehensive household surveys', '🏠', 3),
('Microtasking', 'microtasking', 'Small task completion and validation', '✓', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- SEED DATA: ROLES FOR DIGITIZATION
-- ============================================
INSERT INTO roles (module_id, name, slug, description, display_order)
SELECT 
  m.id,
  'Mapper',
  'mapper',
  'Learn digital mapping, building digitization, and task workflows',
  1
FROM modules m WHERE m.slug = 'digitization'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO roles (module_id, name, slug, description, display_order)
SELECT 
  m.id,
  'Validator',
  'validator',
  'Learn to validate and ensure quality of mapped data',
  2
FROM modules m WHERE m.slug = 'digitization'
ON DUPLICATE KEY UPDATE name=VALUES(name);
