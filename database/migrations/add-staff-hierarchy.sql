-- Migration: Update staff roles and add admin hierarchy
-- Date: December 8, 2025

-- Step 1: Update existing staff roles FIRST (before changing constraint)
UPDATE staff_members 
SET role = 'trainer' 
WHERE role = 'validator' OR role NOT IN ('trainer', 'admin', 'superadmin');

-- Step 2: Add phone_number column
ALTER TABLE staff_members 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Step 3: Add created_by column for tracking who created each staff account
ALTER TABLE staff_members 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);

-- Step 4: Update role constraint to include new roles
ALTER TABLE staff_members 
DROP CONSTRAINT IF EXISTS staff_members_role_check;

ALTER TABLE staff_members 
ADD CONSTRAINT staff_members_role_check 
CHECK (role IN ('trainer', 'admin', 'superadmin'));

-- Step 5: Add foreign key for created_by
ALTER TABLE staff_members
DROP CONSTRAINT IF EXISTS fk_staff_created_by;

ALTER TABLE staff_members
ADD CONSTRAINT fk_staff_created_by 
FOREIGN KEY (created_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL;

-- Step 6: Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role);

COMMIT;
