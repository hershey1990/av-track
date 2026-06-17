create table if not exists public.periods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_locked   boolean not null default false,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now(),
  check (end_date >= start_date)
);

alter table public.periods enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'periods_select_all'
  ) then
    create policy "periods_select_all" on public.periods
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'periods_admin_all'
  ) then
    create policy "periods_admin_all" on public.periods
      for all using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;
