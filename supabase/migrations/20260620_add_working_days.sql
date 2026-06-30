-- Add working_days to profiles
-- Stores ISO weekday numbers: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
-- Default: Monday-Friday
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}';
