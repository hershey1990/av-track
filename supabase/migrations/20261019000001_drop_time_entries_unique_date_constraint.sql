-- Elimina la restricción UNIQUE(user_id, date) de public.time_entries.
--
-- Contexto: la migración 20260629_drop_time_entries_unique_date.sql añadió la
-- columna `slot_index` pero la restricción `time_entries_user_id_date_key`
-- sigue existiendo en el proyecto (se verificó con el error
-- "duplicate key value violates unique constraint time_entries_user_id_date_key").
-- Mientras exista, la app no puede registrar más de una entrada por día, lo
-- que rompe el flujo de múltiples entradas/salidas (slot_index) y el toggle
-- `multi_entry_enabled` de la política de la empresa.
--
-- Es idempotente: no falla si la restricción ya no existe.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'time_entries_user_id_date_key'
      and conrelid = 'public.time_entries'::regclass
  ) then
    alter table public.time_entries
      drop constraint time_entries_user_id_date_key;
  end if;
end $$;

-- Índice de apoyo para las consultas por usuario + fecha.
create index if not exists idx_time_entries_user_date
  on public.time_entries (user_id, date);
