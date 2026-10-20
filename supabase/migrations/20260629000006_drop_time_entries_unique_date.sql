-- Drop UNIQUE(user_id, date) to allow multiple entries per day
-- Add slot_index to order entries within the same day

alter table public.time_entries
  drop constraint if exists time_entries_user_id_date_key;

alter table public.time_entries
  add column slot_index int not null default 0;
