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
- La migración de vacaciones debe estar aplicada antes de desplegar esta versión:
  también instala la función transaccional usada para guardar el temporizador.

## Vacaciones

Cada usuario puede registrar vacaciones como pendientes o aprobadas. Solo las
aprobadas acreditan la jornada estándar por cada día calendario, incluidos
descansos y feriados; estas horas no generan extras, viáticos ni recargos.
No se permiten fechas de inicio anteriores a hoy en Nicaragua, períodos
pendientes o aprobados superpuestos, ni registros de trabajo en vacaciones
aprobadas. Los períodos se pueden editar o cancelar hasta el día de inicio.

## Despliegue

`vercel.json` configura el build con pnpm y el fallback de SPA hacia `index.html`.
