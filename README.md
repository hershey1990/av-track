# BB

Control de horarios laborales con una interfaz premium inspirada en líneas aéreas de lujo.

## Stack

- **Vite + React 19 + TypeScript** (SPA, no es Next.js)
- **react-router-dom v7** (`<Routes>`; `src/App.tsx` es el shell, `src/routes/*` las páginas)
- **Tailwind v4** + shadcn estilo "base-nova" (primitivas **Base UI**)
- **TanStack Query v5** para estado de servidor
- **React Hook Form + Zod v4** para formularios
- **Supabase JS v2** (cliente sin tipar en `src/lib/supabase/client.ts`)

## Variables de entorno

Crear un `.env.local` en la raíz:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Comandos

```bash
pnpm dev     # servidor de desarrollo
pnpm build   # tsc -b + vite build
pnpm test    # vitest
pnpm lint    # eslint
```

## Migraciones de Supabase

Las migraciones viven en `supabase/migrations/` y se aplican en orden de versión
(el prefijo debe ser único: `AAAAMMDD00000N_nombre.sql`).

- **No modificar migraciones ya aplicadas**: crear un fichero nuevo.
- El historial vive en `supabase_migrations.schema_migrations` (`version` es PK).

## Despliegue

`vercel.json` configura el build con pnpm y el fallback de SPA hacia `index.html`.
