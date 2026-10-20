/**
 * Color estable para un concepto de trabajo.
 *
 * Se deriva del texto con un hash, de modo que el mismo concepto siempre
 * tiene el mismo color entre el timeline y el calendario. Vive en su propio
 * módulo para que ambos componentes compartan la misma paleta.
 */

/** Colores de la paleta de charts, en el orden en que se usan. */
const CONCEPT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
];

/**
 * Devuelve la variable CSS del color asignado a un concepto.
 * El texto se normaliza a minúsculas y sin espacios para que "Cliente X" y
 * "cliente x" compartan color.
 */
export function colorForConcept(concept: string): string {
  const normalized = concept.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return CONCEPT_COLORS[hash % CONCEPT_COLORS.length];
}
