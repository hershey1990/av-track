<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- Database migration rules -->
# Reglas para migraciones de Supabase

- No modificar migraciones existentes. Si se necesita un cambio en el esquema, crear una nueva migración SQL en `supabase/migrations/`.
