import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')

export const horizonContributionSchema = z
  .object({
    paidOn: dateSchema,
    creditedOn: dateSchema.optional().nullable(),
    grossAmountArs: z.number().positive('El total debe ser mayor a cero'),
    expensesAmountArs: z.number().min(0, 'Los gastos no pueden ser negativos'),
    housingAmountArs: z.number().min(0, 'El aporte a vivienda no puede ser negativo'),
    paymentMethod: z.enum(['transfer', 'cash']),
    transferFrom: z.string().trim().max(120).optional().nullable(),
    receiptReference: z.string().trim().max(120).optional().nullable(),
    countsForSeniority: z.boolean().default(true),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const split = data.expensesAmountArs + data.housingAmountArs
    if (Math.abs(split - data.grossAmountArs) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['housingAmountArs'],
        message: 'Gastos + vivienda deben coincidir con el total pagado',
      })
    }
    if (data.paymentMethod === 'transfer' && !data.transferFrom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferFrom'],
        message: 'Indicá desde dónde hiciste la transferencia',
      })
    }
  })

export const horizonValuationSchema = z.object({
  effectiveOn: dateSchema,
  officialAmountArs: z.number().positive('Cargá el valor vigente del plan'),
  targetAmountArs: z.number().positive('Cargá el valor vigente de la B68'),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export type HorizonContributionInput = z.infer<typeof horizonContributionSchema>
export type HorizonValuationInput = z.infer<typeof horizonValuationSchema>
