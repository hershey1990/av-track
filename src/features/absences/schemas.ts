import { z } from 'zod'

export const absenceSchema = z.object({
  type: z.enum(['vacation', 'sick', 'compensatory']),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().min(1, 'La fecha de fin es requerida'),
  reason: z.string().optional(),
})

export type AbsenceFormData = z.infer<typeof absenceSchema>
