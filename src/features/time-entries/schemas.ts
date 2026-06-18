import { z } from 'zod'

export const timeEntrySchema = z.object({
  date: z.string().min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  concept: z.string().optional(),
  notes: z.string().optional(),
})

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>

export const dayRowSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  concept: z.string().optional(),
  notes: z.string().optional(),
})

export type DayRowFormData = z.infer<typeof dayRowSchema>
