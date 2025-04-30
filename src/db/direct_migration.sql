-- IMPORTANT: RUN THIS IN THE SUPABASE SQL EDITOR

-- Add assigned_to and assigned_at columns to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_area ON public.complaints(area);

-- Add recycling status columns if needed
ALTER TABLE public.recyclable_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.recyclable_items ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.recyclable_items ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMPTZ;

-- Create a function to execute SQL (so we can run migrations from the app)
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing complaints to have assigned_to match user_id for testing
-- This is for demonstration only - in a real system, assignment would be different from creation
UPDATE public.complaints 
SET assigned_to = user_id
WHERE assigned_to IS NULL;

-- Sample data for testing: Assign some complaints to specific officers
-- Replace these officer IDs with actual officer IDs from your system
UPDATE public.complaints 
SET assigned_to = 'user_2uxZQ8X5cH7G272Zedo8rTwMBj2'
WHERE area = 'bopal' AND assigned_to IS NULL
LIMIT 3;

UPDATE public.complaints 
SET assigned_to = 'user_2VbTuH52j1Yqa6RkMnfIHyST2s1'
WHERE area = 'south bopal' AND assigned_to IS NULL
LIMIT 3; 