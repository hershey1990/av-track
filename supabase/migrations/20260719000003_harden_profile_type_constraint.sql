-- Normalize the legacy partime value and enforce the canonical profile types.
alter table public.profiles
drop constraint if exists profiles_type_check;

update public.profiles
set type = 'parttime'
where type = 'partime';

alter table public.profiles
add constraint profiles_type_check
check (type in ('parttime', 'fulltime'));
