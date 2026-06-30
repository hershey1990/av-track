-- Fix typo: partime → parttime in profiles CHECK constraint

-- Update existing rows
update public.profiles set type = 'parttime' where type = 'partime';

-- Recreate the CHECK constraint (PostgreSQL auto-names it "profiles_type_check")
alter table public.profiles drop constraint if exists profiles_type_check;
alter table public.profiles add constraint profiles_type_check
  check (type in ('parttime', 'fulltime'));
