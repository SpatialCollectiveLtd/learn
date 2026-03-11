-- Learn Platform — Schema v2 (Post-Reset)
-- Date: March 2026
-- Purpose: Minimal schema — Learn owns only training, notifications, and QGIS submissions
-- Identity, attendance, work, and payments are owned by DPW App
--
-- user_id across all tables is the DPW user ID (string).
-- No local user tables — DPW is the identity authority.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TRAINING PROGRESS
-- ============================================
-- Tracks completion of training steps per user per module.
-- This is Learn's core LMS data — DPW does not own this.

CREATE TABLE IF NOT EXISTS training_progress (
  progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  module_type VARCHAR(30) NOT NULL,
  step_id INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_type, step_id)
);

CREATE INDEX idx_training_progress_user ON training_progress(user_id);
CREATE INDEX idx_training_progress_module ON training_progress(module_type);
CREATE INDEX idx_training_progress_user_module ON training_progress(user_id, module_type);

COMMENT ON TABLE training_progress IS 'LMS training step completion. user_id is the DPW user ID.';
COMMENT ON COLUMN training_progress.module_type IS 'Training module: mapper, validator, mobile_mapping, microtasking1, microtasking2, microtasking3, qgis_digitization';
COMMENT ON COLUMN training_progress.step_id IS 'Step number within the module (sequential, 1-based)';

-- ============================================
-- 2. NOTIFICATIONS
-- ============================================
-- Admin-composed messages sent to youth/trainers.
-- Supports audience targeting and scheduled delivery.

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  body VARCHAR(500) NOT NULL,
  link_url TEXT,
  link_label VARCHAR(100),
  sender_id VARCHAR(50) NOT NULL,
  audience_type VARCHAR(30) NOT NULL CHECK (audience_type IN ('all_youth', 'all_trainers', 'by_module', 'by_settlement', 'by_trainer_group', 'individual')),
  audience_filter JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE sent_at IS NULL;

COMMENT ON TABLE notifications IS 'Admin-composed notifications. sender_id is the DPW user ID of the admin.';
COMMENT ON COLUMN notifications.audience_filter IS 'JSON filter: {"module":"digitization"} or {"settlement":"Kayole"} or {"user_id":"KAY123"} etc.';

-- ============================================
-- 3. NOTIFICATION RECIPIENTS
-- ============================================
-- Per-user delivery and read tracking.

CREATE TABLE IF NOT EXISTS notification_recipients (
  recipient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(notification_id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(notification_id, user_id)
);

CREATE INDEX idx_notification_recipients_user ON notification_recipients(user_id);
CREATE INDEX idx_notification_recipients_unread ON notification_recipients(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notification_recipients_notification ON notification_recipients(notification_id);

COMMENT ON TABLE notification_recipients IS 'Tracks delivery and read status per recipient. user_id is the DPW user ID.';

-- ============================================
-- 4. QGIS SUBMISSIONS (Feature 03 — Phase 3/4)
-- ============================================
-- Stores validation results for QGIS files uploaded to Google Drive.
-- Created now as placeholder — populated when Google Drive integration goes live.

CREATE TABLE IF NOT EXISTS qgis_submissions (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  submission_date DATE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255),
  drive_path TEXT,
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'pass', 'fail', 'warning')),
  validation_results JSONB DEFAULT '{}',
  requires_rework BOOLEAN DEFAULT FALSE,
  rework_resolved BOOLEAN DEFAULT FALSE,
  rework_resolved_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qgis_submissions_user ON qgis_submissions(user_id);
CREATE INDEX idx_qgis_submissions_date ON qgis_submissions(submission_date);
CREATE INDEX idx_qgis_submissions_status ON qgis_submissions(validation_status);
CREATE INDEX idx_qgis_submissions_rework ON qgis_submissions(requires_rework) WHERE requires_rework = TRUE AND rework_resolved = FALSE;

COMMENT ON TABLE qgis_submissions IS 'QGIS file validation results from Google Drive uploads. user_id is the DPW user ID.';
COMMENT ON COLUMN qgis_submissions.validation_results IS 'JSON: {"checks": [{"name":"file_naming","status":"pass"}, {"name":"geometry_valid","status":"fail","reason":"Self-intersecting polygon at feature 42"}]}';
