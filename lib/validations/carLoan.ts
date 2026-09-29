import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')

export const carLoanPaymentSchema = z.object({
  installmentId: z.string().uuid(),
  paidAmountArs: z.number().positive('Cargá cuánto pagaste'),
  paidOn: dateSchema,
})

export const carLoanExpectedSchema = z.object({
  installmentId: z.string().uuid(),
  expectedTotalArs: z.number().positive('Cargá el valor de la cuota'),
})

export const carLoanInsuranceSchema = z.object({
  fromNumber: z.number().int().min(1).max(60),
  insuranceArs: z.number().min(0, 'El seguro no puede ser negativo'),
})

export type CarLoanPaymentInput = z.infer<typeof carLoanPaymentSchema>
export type CarLoanExpectedInput = z.infer<typeof carLoanExpectedSchema>
export type CarLoanInsuranceInput = z.infer<typeof carLoanInsuranceSchema>
