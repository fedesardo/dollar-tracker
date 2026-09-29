import { z } from 'zod'
import { COVERAGE_CATALOG, COVERAGE_STATUSES } from '@/lib/utils/carInsurance'

const validKeys = new Set(COVERAGE_CATALOG.map((item) => item.key))

const coverageValueSchema = z.object({
  status: z.enum(COVERAGE_STATUSES as [string, ...string[]]),
  detail: z.string().trim().max(400),
})

export const carInsuranceOfferSchema = z.object({
  insurer: z.string().trim().min(1, 'Poné la compañía').max(120),
  planName: z.string().trim().min(1, 'Poné el nombre del plan').max(120),
  monthlyPremiumArs: z.number().positive('Cargá cuánto sale por mes').nullable(),
  validFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .nullable(),
  insuredSumArs: z.number().positive().nullable(),
  notes: z.string().trim().max(1000).nullable(),
  coverages: z
    .record(coverageValueSchema)
    .refine((map) => Object.keys(map).every((key) => validKeys.has(key)), {
      message: 'Cobertura desconocida',
    }),
})

export type CarInsuranceOfferInput = z.infer<typeof carInsuranceOfferSchema>
