/** Viático por defecto en córdobas (C$). */
export const VIATICO_DEFAULT = 180.00
/** Horas de jornada necesarias para que aplica el viático. */
export const THRESHOLD_VIATICO_HORAS = 7
/** Jornada estándar según el tipo de contrato. */
export const STANDARD_HOURS_PARTTIME = 5
export const STANDARD_HOURS_FULLTIME = 8
/**
 * Código ISO 3166-1 alpha-2 del país al que aplican los feriados y la
 * política de recargos. La app opera en Nicaragua; la tabla `countries` ya
 * trae CR y SV para futuras ampliaciones, pero la zona horaria
 * (`src/lib/timezone.ts`) y los recargos son propios de NI.
 */
export const DEFAULT_COUNTRY_CODE = 'NI'
