import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(1),
  type: z.enum(['parttime', 'fulltime']),
  working_days: z.array(z.number()),
})

export type ProfileFormData = z.infer<typeof profileSchema>
