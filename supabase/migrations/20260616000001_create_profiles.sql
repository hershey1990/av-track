create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  type        text not null check (type in ('partime', 'fulltime')),
  role        text not null default 'user' check (role in ('user', 'admin')),
  viatico     numeric(10,2) not null default 180.00,
  extra_rate  numeric(10,2) not null default 0.00,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'profiles_select_own_or_admin'
  ) then
    create policy "profiles_select_own_or_admin" on public.profiles
      for select using (auth.uid() = id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own" on public.profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'profiles_update_own_or_admin'
  ) then
    create policy "profiles_update_own_or_admin" on public.profiles
      for update using (auth.uid() = id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'profiles_delete_admin'
  ) then
    create policy "profiles_delete_admin" on public.profiles
      for delete using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

-- Trigger: primer usuario registrado es admin
create or replace function public.handle_first_user()
returns trigger as $$
begin
  if not exists (select 1 from public.profiles) then
    new.role := 'admin';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  before insert on public.profiles
  for each row execute function public.handle_first_user();
