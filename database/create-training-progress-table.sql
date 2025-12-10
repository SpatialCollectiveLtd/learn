-- Create table for tracking youth training progress
-- This ensures youth complete steps sequentially and tracks their learning journey

CREATE TABLE IF NOT EXISTS youth_training_progress (
  progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  module_type VARCHAR(20) NOT NULL CHECK (module_type IN ('mapper', 'validator')),
  step_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  UNIQUE(youth_id, module_type, step_id) -- Prevent duplicate completions
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_youth ON youth_training_progress(youth_id);
CREATE INDEX IF NOT EXISTS idx_progress_module ON youth_training_progress(module_type);
CREATE INDEX IF NOT EXISTS idx_progress_youth_module ON youth_training_progress(youth_id, module_type);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON youth_training_progress(completed_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_youth_training_progress_updated_at 
BEFORE UPDATE ON youth_training_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE youth_training_progress IS 'Tracks completion of training steps to ensure sequential learning';
COMMENT ON COLUMN youth_training_progress.module_type IS 'Either mapper or validator training module';
COMMENT ON COLUMN youth_training_progress.step_id IS 'Step number within the module (1-7 for both mapper and validator)';
