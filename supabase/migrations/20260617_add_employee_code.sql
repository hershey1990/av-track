-- Add employee_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_code text;

-- Unique index only for non-null values (multiple users can have NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_employee_code_idx
  ON public.profiles(employee_code)
  WHERE employee_code IS NOT NULL;
