create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('vacation', 'sick', 'compensatory')),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absences_dates_check check (end_date >= start_date)
);

-- Index for fast user lookups
create index idx_absences_user_id on absences(user_id);
create index idx_absences_status on absences(status);
create index idx_absences_dates on absences(start_date, end_date);

-- RLS
alter table absences enable row level security;

-- Users can read their own absences
create policy "Users can read own absences"
  on absences for select
  using (auth.uid() = user_id);

-- Users can insert their own absences
create policy "Users can insert own absences"
  on absences for insert
  with check (auth.uid() = user_id);

-- Admins can read all absences
create policy "Admins can read all absences"
  on absences for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Admins can update any absence (approve/reject)
create policy "Admins can update absences"
  on absences for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
