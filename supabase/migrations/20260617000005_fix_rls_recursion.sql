-- Fix RLS recursion: use security definer function to check admin role
-- instead of subqueries that hit the same table with RLS enabled.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = uid),
    false
  );
$$;

-- Drop old policies that use the recursive subquery
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;
drop policy if exists "periods_admin_all" on public.periods;

-- Recreate profiles policies using is_admin()
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin(auth.uid()));

-- Recreate periods admin policy using is_admin()
create policy "periods_admin_all" on public.periods
  for all using (public.is_admin(auth.uid()));
