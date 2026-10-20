-- Revoca el permiso de ejecución de public.list_colleagues() al rol `anon`.
--
-- Contexto: la migración 20261019000002 creó la función como SECURITY DEFINER
-- y ejecutó `revoke all on function ... from public`. Eso no basta: los
-- `alter default privileges` de Supabase conceden EXECUTE a `anon`,
-- `authenticated` y `service_role` en el momento de CREAR la función, y
-- revocar el rol PUBLIC no retira esa concesión explícita.
-- Resultado: el advisor de seguridad reportaba que `anon` podía invocar la
-- RPC en /rest/v1/rpc/list_colleagues.
--
-- Sólo se revoca a `anon`: la app la llama con la sesión autenticada del
-- usuario, que debe conservar el permiso.

revoke execute on function public.list_colleagues() from anon;
