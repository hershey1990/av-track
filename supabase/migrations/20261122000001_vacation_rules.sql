-- Serialize vacation and time-entry changes per employee, including changes
-- made through clients other than the application.
create table public.vacation_transaction_locks (
  user_id uuid primary key references public.profiles(id) on delete cascade
);
alter table public.vacation_transaction_locks enable row level security;

create function public.lock_vacation_user(employee_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.vacation_transaction_locks(user_id) values (employee_id)
  on conflict (user_id) do update set user_id = excluded.user_id;
$$;
revoke all on function public.lock_vacation_user(uuid) from public, anon, authenticated;

create or replace function public.check_vacation_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  today_nicaragua date := (now() at time zone 'America/Managua')::date;
  is_admin boolean;
begin
  if tg_op = 'DELETE' then
    if old.type <> 'vacation' then return old; end if;
    perform pg_advisory_xact_lock(hashtextextended(old.user_id::text, 0));
    perform public.lock_vacation_user(old.user_id);
    if old.start_date < today_nicaragua then
      raise exception 'No se pueden cancelar vacaciones que ya comenzaron.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.type = 'vacation' or new.type = 'vacation') then
    if old.type <> new.type or old.user_id <> new.user_id then
      raise exception 'No se puede cambiar el propietario ni el tipo de vacaciones.';
    end if;
    select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
      into is_admin;
    if not is_admin then
      if new.status = 'rejected' then
        raise exception 'No se puede establecer el estado rechazado.';
      end if;
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
  end if;
  if new.type <> 'vacation' then return new; end if;

  if tg_op = 'INSERT' and (new.status = 'rejected' or new.reviewed_by is not null or new.reviewed_at is not null) then
    raise exception 'Estado o datos de revisión inválidos para vacaciones.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  perform public.lock_vacation_user(new.user_id);
  if tg_op = 'UPDATE' and old.start_date < today_nicaragua then
    raise exception 'No se pueden modificar vacaciones que ya comenzaron.';
  end if;
  if new.start_date < today_nicaragua or new.end_date < new.start_date then
    raise exception 'Las vacaciones deben comenzar hoy o en una fecha futura y terminar después del inicio.';
  end if;
  if new.status in ('pending', 'approved') and exists (
    select 1 from public.absences a
    where a.user_id = new.user_id and a.type = 'vacation'
      and a.status in ('pending', 'approved') and a.id <> new.id
      and a.start_date <= new.end_date and a.end_date >= new.start_date
  ) then
    raise exception 'El período se superpone con otras vacaciones pendientes o aprobadas.';
  end if;
  if new.status = 'approved' and exists (
    select 1 from public.time_entries e
    where e.user_id = new.user_id and e.date between new.start_date and new.end_date
  ) then
    raise exception 'Hay registros de trabajo en el período de vacaciones.';
  end if;
  return new;
end;
$$;

create trigger vacation_change_guard
before insert or update or delete on public.absences
for each row execute function public.check_vacation_change();

create or replace function public.check_entry_vacation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  perform public.lock_vacation_user(new.user_id);
  if exists (
    select 1 from public.absences a
    where a.user_id = new.user_id and a.type = 'vacation'
      and a.status = 'approved' and new.date between a.start_date and a.end_date
  ) then
    raise exception 'No se pueden registrar horas durante vacaciones aprobadas.';
  end if;
  return new;
end;
$$;

create trigger entry_vacation_guard
before insert or update on public.time_entries
for each row execute function public.check_entry_vacation();

create policy "vacations_update_own" on public.absences
  for update to authenticated
  using (auth.uid() = user_id and type = 'vacation')
  with check (auth.uid() = user_id and type = 'vacation');

create policy "vacations_delete_own" on public.absences
  for delete to authenticated
  using (auth.uid() = user_id and type = 'vacation');

-- A multi-day timer must either save all segments or none of them.
create or replace function public.save_timer_segments(segments jsonb, entry_concept text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  segment record;
  next_slot integer;
begin
  if auth.uid() is null or jsonb_typeof(segments) <> 'array' or jsonb_array_length(segments) = 0 then
    raise exception 'Los segmentos del temporizador no son válidos.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  for segment in
    select * from jsonb_to_recordset(segments) as s(date date, start_time time, end_time time)
  loop
    select coalesce(max(slot_index), -1) + 1 into next_slot
      from public.time_entries where user_id = auth.uid() and date = segment.date;
    insert into public.time_entries(user_id, date, start_time, end_time, slot_index, concept, notes)
      values (auth.uid(), segment.date, segment.start_time, segment.end_time, next_slot, entry_concept, '');
  end loop;
end;
$$;
revoke all on function public.save_timer_segments(jsonb, text) from public, anon;
grant execute on function public.save_timer_segments(jsonb, text) to authenticated;
