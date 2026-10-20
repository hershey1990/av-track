-- Módulo de Solicitudes: Ausencias y Cambios de turno
--
-- 1) public.list_colleagues()
--    Los empleados no pueden leer otros perfiles (política
--    "profiles_select_own_or_admin": sólo la propia fila o admin).  Para
--    poder elegir a un compañero en una solicitud de cambio de turno
--    necesitamos exponer id + nombre sin filtrar el resto de la fila
--    (viático, tarifa extra, código de empleado, rol, etc.).
--    Se resuelve con una función SECURITY DEFINER que devuelve sólo las
--    columnas necesarias.
--
-- 2) Política DELETE sobre public.absences
--    La tabla no tenía política de borrado, así que el botón "eliminar"
--    de las solicitudes fallaba siempre con un error de permisos.
--    Sólo se permite borrar la propia solicitud y sólo mientras siga pendiente.
--
-- Ambas partes son idempotentes.

-- ── 1) Listar compañeros ────────────────────────────────────────────────
create or replace function public.list_colleagues()
returns table (id uuid, full_name text, type text)
language sql
security definer
stable
set search_path = ''
as $$
  select p.id, p.full_name, p.type
  from public.profiles p
  where p.id <> auth.uid()
  order by p.full_name;
$$;

revoke all on function public.list_colleagues() from public;
grant execute on function public.list_colleagues() to authenticated;

-- ── 2) Borrado de solicitudes de ausencia ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'absences_delete_own_pending'
      and tablename = 'absences'
  ) then
    create policy "absences_delete_own_pending" on public.absences
      for delete using (auth.uid() = user_id and status = 'pending');
  end if;
end $$;
