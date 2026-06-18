import { z } from 'zod'

export const periodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
})

export type PeriodFormData = z.infer<typeof periodSchema>

export const userEditSchema = z.object({
  full_name: z.string().min(1),
  employee_code: z.string().optional(),
  type: z.enum(['partime', 'fulltime']),
  role: z.enum(['user', 'admin']),
  viatico: z.coerce.number().min(0),
  extra_rate: z.coerce.number().min(0),
})

export type UserEditFormData = z.infer<typeof userEditSchema>
