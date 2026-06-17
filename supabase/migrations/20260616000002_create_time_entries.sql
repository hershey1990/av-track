create table if not exists public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  concept     text not null default '',
  notes       text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, date)
);

alter table public.time_entries enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'entries_select_own_or_admin'
  ) then
    create policy "entries_select_own_or_admin" on public.time_entries
      for select using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'entries_insert_own'
  ) then
    create policy "entries_insert_own" on public.time_entries
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'entries_update_own_or_admin'
  ) then
    create policy "entries_update_own_or_admin" on public.time_entries
      for update using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'entries_delete_own_or_admin'
  ) then
    create policy "entries_delete_own_or_admin" on public.time_entries
      for delete using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;
