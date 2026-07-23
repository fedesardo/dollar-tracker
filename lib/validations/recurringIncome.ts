import { z } from 'zod'
import { ownerSchema, moneySchema, optionalNotes } from './transaction'

export const recurringIncomeSchema = z.object({
  description: z.string().min(1, 'Poné una descripción').max(200),
  beneficiary: ownerSchema,
  walletId: z.string().uuid(),
  amountUsd: moneySchema,
  dayOfMonth: z
    .number({ invalid_type_error: 'Día inválido' })
    .int('Tiene que ser un número entero')
    .min(1, 'Mínimo día 1')
    .max(31, 'Máximo día 31'),
  isActive: z.boolean().default(true),
  notes: optionalNotes,
})
export type RecurringIncomeInput = z.infer<typeof recurringIncomeSchema>
