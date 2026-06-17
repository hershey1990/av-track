# Mejorar el Estilo de las Tablas

## Resumen

Mejora integral del diseño visual y la consistencia de todas las tablas en la aplicación de time-tracking. Actualmente hay una mezcla de tablas HTML crudas y el componente `Table` de shadcn/ui con estilos inconsistentes entre páginas.

## Hallazgos del Análisis

### Estado actual

| Ubicación | Tipo de tabla | Componente usado |
|-----------|--------------|-------------------|
| `PeriodSummaryTable` (`period-summary.tsx`) | Resumen del período | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` ✅ |
| `HistoryPage` (`history/page.tsx`) | Historial de registros | `<table>` HTML crudo ❌ |
| `UserEntriesPage` (`admin/users/[id]/entries/page.tsx`) | Entradas de usuario | `<table>` HTML crudo ❌ |
| `DayRow` (`day-row.tsx`) | Fila individual | `<tr>`, `<td>` HTML crudos ❌ |

### Problemas identificados

1. **Inconsistencia**: Dos páginas usan `<table>` HTML crudo con clases inline en lugar del componente `Table` de shadcn.
2. **`DayRow` no usa los componentes**: Renderiza `<tr>` y `<td>` directamente, sin aprovechar `TableRow`/`TableCell`.
3. **Encabezados poco prominentes**: El componente `TableHead` de shadcn solo tiene `font-medium` y `h-10`, sin fondo distintivo.
4. **Padding mínimo**: Celdas usan `p-2`, muy apretado visualmente.
5. **Falta de wrapper consistente**: Solo `PeriodSummaryTable` usa el wrapper `rounded-md border`.
6. **Sin zebra striping ni separadores visuales** entre filas.

## Pasos de Implementación

### Paso 1: Mejorar el componente `Table` base

**Archivo**: `src/components/ui/table.tsx`

Actualizar los estilos base del componente para que todas las tablas se beneficien automáticamente:

- **`TableHead`**: Agregar `bg-muted/50 text-muted-foreground` para fondo sutil y jerarquía tipográfica. Cambiar padding a `px-4` para más respiración. Quitar `whitespace-nowrap` para permitir wrapping en columnas estrechas.
- **`TableCell`**: Cambiar padding a `px-4 py-3` para más espacio vertical y horizontal.
- **`TableRow`**: Agregar `data-[state=selected]:bg-muted` para consistencia con shadcn patterns.
- **`Table`**: Agregar `border-separate border-spacing-0` para bordes más limpios.

Esto mejora automáticamente el `PeriodSummaryTable` (que ya usa el componente) y prepara el terreno para las conversiones.

### Paso 2: Convertir `DayRow` a usar `TableRow` y `TableCell`

**Archivo**: `src/features/time-entries/components/day-row.tsx`

- Reemplazar `<tr className="border-b text-sm">` por `<TableRow>`
- Reemplazar cada `<td className="py-2">` por `<TableCell>` con las clases específicas necesarias
- Mantener el `max-w-[120px] truncate` en la celda de concepto
- Mantener el `font-medium` en la celda de horas
- El `TableRow` ya provee `border-b` y `hover:bg-muted/50`

### Paso 3: Convertir tabla cruda en HistoryPage

**Archivo**: `src/app/(dashboard)/history/page.tsx`

- Reemplazar `<div className="overflow-x-auto"><table>...</table></div>` por el wrapper `<div className="rounded-md border">` + `<Table>`
- Reemplazar `<thead className="border-b bg-muted/50">` por `<TableHeader>`
- Reemplazar `<th>` por `<TableHead>`
- Reemplazar `<tbody>` por `<TableBody>`
- Las filas son renderizadas por `DayRow`, que ya usará `TableRow`/`TableCell`

### Paso 4: Convertir tabla cruda en UserEntriesPage

**Archivo**: `src/app/admin/users/[id]/entries/page.tsx`

- Idéntico al Paso 3: reemplazar tabla HTML cruda con componentes de shadcn

### Paso 5: Agregar wrapper `rounded-md border` al componente `Table`

**Archivo**: `src/components/ui/table.tsx`

- Mover el wrapper `rounded-md border` dentro del componente `Table` para que sea consistente en todos los usos
- Actualizar `PeriodSummaryTable` para quitar su wrapper redundante

### Paso 6: Verificar modo oscuro

Revisar todas las páginas con tablas en modo oscuro para asegurar que los estilos funcionan correctamente (los tokens `muted`, `border`, etc. ya están definidos para ambos temas).

## Pruebas

- [x] `npm run build` compila sin errores
- [x] Revisar visualmente: HistoryPage con datos
- [x] Revisar visualmente: Dashboard con PeriodSummaryTable
- [x] Revisar visualmente: ReportPage con período seleccionado
- [x] Revisar visualmente: Admin > User entries
- [x] Verificar modo oscuro en cada página con tablas
- [ ] Verificar responsive: scroll horizontal en móvil

## Riesgos

- **Bajo**: Los cambios en el componente `Table` base afectan a todos los consumidores. Se mitiga verificando cada página.
- **Bajo**: `DayRow` se usa en history y user-entries; el cambio a `TableRow`/`TableCell` debe preservar todo el comportamiento existente (edición, eliminación).
- **Mínimo**: Los estilos de padding más grandes podrían causar más scroll horizontal en móvil; se mitiga manteniendo `overflow-x-auto`.