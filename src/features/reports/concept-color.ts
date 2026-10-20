/**
 * Color estable para un concepto.
 *
 * Se deriva del texto del concepto para que el mismo concepto conserve el
 * mismo color en el gráfico, en la tabla y en el detalle diario, sin
 * necesidad de guardar nada en la base de datos.
 *
 * El hash es el mismo que usa `timeline-chart.tsx` para las bandas del
 * horario.
 */

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Hash determinista de un texto a un entero de 32 bits. */
export function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Variable CSS del color asignado a un concepto. */
export function conceptColorVar(concept: string): string {
  const key = concept || "Sin concepto";
  return PALETTE[hashString(key) % PALETTE.length];
}
