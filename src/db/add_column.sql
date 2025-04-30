-- Add assigned_to column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_area ON complaints(area);

-- Update existing complaints to have assigned_to match user_id for testing
-- This is for demonstration only - in a real system, assignment would be different from creation
UPDATE complaints 
SET assigned_to = user_id
WHERE assigned_to IS NULL; 