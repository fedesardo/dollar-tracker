import { z } from 'zod'

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Mes inválido')

export const householdSaveSchema = z.object({
  itemId: z.string().uuid(),
  month: monthSchema,
  amount: z.number().min(0, 'El monto no puede ser negativo').nullable(),
  monthsPerCharge: z.number().int().min(1).max(12),
})

export const householdCreateSchema = z.object({
  name: z.string().trim().min(1, 'Poné el nombre').max(120),
  groupKey: z.enum(['casa', 'auto', 'plataformas', 'clubes', 'otros']),
  currency: z.enum(['ARS', 'USD']),
  monthsPerCharge: z.number().int().min(1).max(12),
  month: monthSchema,
  amount: z.number().min(0).nullable(),
})

export type HouseholdSaveInput = z.infer<typeof householdSaveSchema>
export type HouseholdCreateInput = z.infer<typeof householdCreateSchema>
