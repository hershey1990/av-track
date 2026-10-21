import { z } from 'zod'

/**
 * Esquema del formulario de feriados.
 *
 * La fecha es un string "yyyy-MM-dd" (mismo formato que la columna `date` de
 * la BD), igual que en el resto de los formularios de la app.
 */
export const holidaySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  date: z.string().min(1, 'Elegí la fecha del feriado'),
})

export type HolidayFormData = z.infer<typeof holidaySchema>
