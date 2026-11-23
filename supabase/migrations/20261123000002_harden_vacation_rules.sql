-- Prevent direct RPC exposure of trigger-only functions.
revoke all on function public.check_vacation_change() from public, anon, authenticated;
revoke all on function public.check_entry_vacation() from public, anon, authenticated;

-- The lock table is maintained only by SECURITY DEFINER trigger helpers.
-- Explicitly deny direct API access while keeping RLS enabled.
create policy "vacation_transaction_locks_no_api_access"
  on public.vacation_transaction_locks
  for all
  to anon, authenticated
  using (false)
  with check (false);
