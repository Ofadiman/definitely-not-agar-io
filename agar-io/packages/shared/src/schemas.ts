import { z } from 'zod'

export const playerFormSchema = z.object({
  name: z.string().min(3).max(20),
})

export type PlayerForm = z.infer<typeof playerFormSchema>
