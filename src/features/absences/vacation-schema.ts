import { z } from 'zod'
import { getTodayNicaragua } from '@/lib/timezone'

export const vacationSchema = z.object({
  start_date: z.iso.date({ error: 'Elegí una fecha de inicio válida' }),
  end_date: z.iso.date({ error: 'Elegí una fecha de fin válida' }),
  status: z.enum(['pending', 'approved']),
}).superRefine((values, ctx) => {
  if (values.start_date < getTodayNicaragua()) {
    ctx.addIssue({ code: 'custom', path: ['start_date'], message: 'La fecha debe ser hoy o posterior' })
  }
  if (values.end_date < values.start_date) {
    ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'La fecha de fin debe ser igual o posterior al inicio' })
  }
})

export type VacationFormData = z.infer<typeof vacationSchema>
