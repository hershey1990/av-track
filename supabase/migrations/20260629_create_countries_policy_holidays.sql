-- Create countries, policy_config and holidays tables
-- Seed data for Nicaragua (+ neighbors) and Nicaraguan national holidays

-- ── Countries ──────────────────────────────────────────────────

create table if not exists public.countries (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique             -- ISO 3166-1 alpha-2
);

alter table public.countries enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'countries_select_all'
  ) then
    create policy "countries_select_all" on public.countries
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'countries_admin_all'
  ) then
    create policy "countries_admin_all" on public.countries
      for all using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

-- ── Policy Config ──────────────────────────────────────────────

create table if not exists public.policy_config (
  id                      uuid primary key default gen_random_uuid(),
  country_id              uuid not null references public.countries(id) on delete cascade,
  night_start             time not null default '19:00',
  night_end               time not null default '06:00',
  night_surcharge_pct     numeric(5,2) not null default 25.00,
  sunday_surcharge_pct    numeric(5,2) not null default 100.00,
  holiday_surcharge_pct   numeric(5,2) not null default 100.00,
  extra_threshold_minutes integer not null default 15,
  rounding_block_minutes  integer not null default 30,
  currency                text not null default 'NIO',
  multi_entry_enabled     boolean not null default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique(country_id)
);

alter table public.policy_config enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'policy_config_select_all'
  ) then
    create policy "policy_config_select_all" on public.policy_config
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'policy_config_admin_all'
  ) then
    create policy "policy_config_admin_all" on public.policy_config
      for all using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

-- ── Holidays ───────────────────────────────────────────────────

create table if not exists public.holidays (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  date       date not null,
  name       text not null,
  unique(country_id, date)
);

alter table public.holidays enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'holidays_select_all'
  ) then
    create policy "holidays_select_all" on public.holidays
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'holidays_admin_all'
  ) then
    create policy "holidays_admin_all" on public.holidays
      for all using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;
end $$;

-- ── Seed data ──────────────────────────────────────────────────

insert into public.countries (code, name) values
  ('NI', 'Nicaragua'),
  ('CR', 'Costa Rica'),
  ('SV', 'El Salvador')
on conflict (code) do nothing;

do $$
declare
  v_nic_id uuid;
begin
  select id into v_nic_id from public.countries where code = 'NI';

  -- Default policy for Nicaragua
  insert into public.policy_config (country_id, currency) values
    (v_nic_id, 'NIO')
  on conflict (country_id) do nothing;

  -- Fixed-date Nicaraguan national holidays
  insert into public.holidays (country_id, date, name) values
    (v_nic_id, '2026-01-01', 'Año Nuevo'),
    (v_nic_id, '2026-05-01', 'Día del Trabajador'),
    (v_nic_id, '2026-05-30', 'Día de la Madre'),
    (v_nic_id, '2026-07-19', 'Revolución Sandinista'),
    (v_nic_id, '2026-09-14', 'Batalla de San Jacinto'),
    (v_nic_id, '2026-09-15', 'Día de la Independencia'),
    (v_nic_id, '2026-11-02', 'Día de los Muertos'),
    (v_nic_id, '2026-12-08', 'La Purísima (Inmaculada Concepción)'),
    (v_nic_id, '2026-12-25', 'Navidad'),
    -- 2027
    (v_nic_id, '2027-01-01', 'Año Nuevo'),
    (v_nic_id, '2027-05-01', 'Día del Trabajador'),
    (v_nic_id, '2027-05-30', 'Día de la Madre'),
    (v_nic_id, '2027-07-19', 'Revolución Sandinista'),
    (v_nic_id, '2027-09-14', 'Batalla de San Jacinto'),
    (v_nic_id, '2027-09-15', 'Día de la Independencia'),
    (v_nic_id, '2027-11-02', 'Día de los Muertos'),
    (v_nic_id, '2027-12-08', 'La Purísima (Inmaculada Concepción)'),
    (v_nic_id, '2027-12-25', 'Navidad')
  on conflict (country_id, date) do nothing;

  -- Note: Jueves Santo and Viernes Santo (movable holidays) must be
  -- added by an admin each year since they depend on the lunar calendar.
end $$;
