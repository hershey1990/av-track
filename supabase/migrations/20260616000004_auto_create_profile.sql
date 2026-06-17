-- Trigger: crear profile automáticamente al registrarse
-- Lee los datos de raw_user_meta_data (full_name, type) pasados desde signUp

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first boolean;
begin
  -- Determinar si es el primer usuario
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (id, full_name, type, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data ->> 'type', 'fulltime'),
    case when is_first then 'admin' else 'user' end
  );

  return new;
end;
$$;

-- Eliminar trigger y función viejos que ya no se necesitan
drop trigger if exists on_profile_created on public.profiles;
drop function if exists public.handle_first_user();

-- Crear nuevo trigger sobre auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
