-- Create shift swap requests table
create table if not exists public.shift_swaps (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references auth.users(id) on delete cascade,
  target_id      uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  requester_shift text, -- optional: current shift time (free text)
  target_shift   text,   -- optional: proposed shift time
  reason         text,
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  responded_at   timestamptz,
  created_at     timestamptz default now()
);

-- Indexes
create index if not exists shift_swaps_requester_idx on public.shift_swaps(requester_id, status);
create index if not exists shift_swaps_target_idx on public.shift_swaps(target_id, status);

-- Enable RLS
alter table public.shift_swaps enable row level security;

-- Policies: requester can CRUD own swaps
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'shift_swaps_requester_all'
  ) then
    create policy "shift_swaps_requester_all" on public.shift_swaps
      for all using (requester_id = auth.uid());
  end if;
end $$;

-- Target can read and update (accept/reject) swaps directed to them
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'shift_swaps_target_select'
  ) then
    create policy "shift_swaps_target_select" on public.shift_swaps
      for select using (target_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'shift_swaps_target_update'
  ) then
    create policy "shift_swaps_target_update" on public.shift_swaps
      for update using (target_id = auth.uid());
  end if;
end $$;

-- Admins can see all
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'shift_swaps_admin_all'
  ) then
    create policy "shift_swaps_admin_all" on public.shift_swaps
      for all using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;
