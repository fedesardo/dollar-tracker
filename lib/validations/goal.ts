import { z } from 'zod'

export const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetUsd: z.number().positive(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#22c55e'),
  icon: z.string().max(10).default('🎯'),
})

export type GoalInput = z.infer<typeof goalSchema>
