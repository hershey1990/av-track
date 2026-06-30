-- Create notifications table for in-app notifications
create table if not exists public.notifications (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  type      text not null check (type in ('absence_request', 'absence_approved', 'absence_rejected', 'period_approval', 'period_approved', 'period_rejected', 'shift_swap', 'system')),
  title     text not null,
  message   text not null,
  link      text,
  is_read   boolean not null default false,
  created_at timestamptz default now()
);

-- Index for quick unread queries
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies: users can read their own notifications
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own" on public.notifications
      for select using (user_id = auth.uid());
  end if;
end $$;

-- Users can update their own notifications (mark as read)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own" on public.notifications
      for update using (user_id = auth.uid());
  end if;
end $$;

-- Authenticated users can insert notifications (for server-side functions)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'notifications_insert_all'
  ) then
    create policy "notifications_insert_all" on public.notifications
      for insert with check (true);
  end if;
end $$;

-- Enable Realtime for notifications
alter publication supabase_realtime add table public.notifications;
