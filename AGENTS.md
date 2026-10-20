# Stack del proyecto

- **Vite + React 19 + TypeScript** (NO es Next.js). Entrada: `index.html` → `src/main.tsx`.
- Router: `react-router-dom` v7 con `<Routes>` (sin data router). `src/App.tsx` es el shell real y `src/routes/*` contiene las páginas.
- Tailwind v4 vía `@tailwindcss/vite` + shadcn estilo "base-nova" (primitivas **Base UI**, no Radix).
- Estado de servidor: TanStack Query v5. Formularios: React Hook Form + Zod v4.
- Datos: Supabase JS v2 (cliente **sin tipar** en `src/lib/supabase/client.ts`).

<!-- Database migration rules -->
# Reglas para migraciones de Supabase

- No modificar migraciones existentes. Si se necesita un cambio en el esquema, crear una nueva migración SQL en `supabase/migrations/`.
- El **prefijo de versión debe ser único** (`AAAAMMDD00000N_nombre.sql`, 14 dígitos). `supabase_migrations.schema_migrations.version` es la clave primaria: dos migraciones con la misma versión no se pueden registrar.
- Tras aplicar con el MCP (`apply_migration`), realinear la versión del historial remoto con el nombre del archivo local.
