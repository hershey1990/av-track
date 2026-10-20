-- Impide entradas duplicadas dentro del mismo día y turno.
--
-- Contexto: la migración 20261019000001 eliminó `UNIQUE(user_id, date)` para
-- permitir varias entradas por día, pero dejó `slot_index` sin ninguna
-- restricción. El cliente calcula el siguiente `slot_index` leyendo el
-- máximo actual e insertando después (read-then-insert), así que dos
-- insertions simultáneas (doble clic, dos pestañas, el tracker junto al
-- formulario manual) calculan el mismo `slot_index` y se duplican de forma
-- silenciosa.
--
-- Con esta restricción la segunda inserción falla con 23505 en lugar de
-- corromper los datos, y el cliente reintenta con el siguiente slot.
--
-- Idempotente y seguro: sólo se aplica si no hay duplicados previos.

do $$
begin
  if exists (
    select 1
    from public.time_entries
    group by user_id, date, slot_index
    having count(*) > 1
  ) then
    raise exception 'Hay entradas duplicadas (user_id, date, slot_index): no se puede crear la restricción';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_entries_user_id_date_slot_index_key'
      and conrelid = 'public.time_entries'::regclass
  ) then
    alter table public.time_entries
      add constraint time_entries_user_id_date_slot_index_key
      unique (user_id, date, slot_index);
  end if;
end $$;
