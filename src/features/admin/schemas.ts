import { z } from 'zod'

/**
 * Esquema de los períodos.
 *
 * El `name` es **opcional**: si se deja vacío, el formulario lo deriva de las
 * fechas (`buildPeriodName`). Por eso queda como `string` (no `optional()` /
 * `default()`), para no alterar el tipo de entrada que espera `zodResolver`.
 */
export const periodSchema = z
  .object({
    name: z.string().trim().max(120, 'El nombre es demasiado largo'),
    start_date: z.string().min(1, 'La fecha de inicio es requerida'),
    end_date: z.string().min(1, 'La fecha de fin es requerida'),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_date'],
        message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
      })
    }
  })

export type PeriodFormData = z.infer<typeof periodSchema>

/**
 * La regla de "no abrir un período antes del último período cerrado" y la de
 * "no solaparse" dependen de los períodos existentes, así que no pueden vivir
 * en el schema: se validan en el formulario con `validateNewPeriod`
 * (`src/features/admin/period-rules.ts`).
 */

export const userEditSchema = z.object({
  full_name: z.string().min(1),
  employee_code: z.string().optional(),
  type: z.enum(['parttime', 'fulltime']),
  role: z.enum(['user', 'admin']),
  viatico: z.coerce.number().min(0),
  extra_rate: z.coerce.number().min(0),
})

export type UserEditFormData = z.infer<typeof userEditSchema>
