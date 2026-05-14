import { z } from 'zod'

export const ownerSchema = z.enum(['fede', 'flor', 'joint'])

export const expenseCategories = [
  'Hogar',
  'Viaje',
  'Salud',
  'Auto',
  'Comida',
  'Deuda',
  'Otro',
] as const
export const expenseCategorySchema = z.enum(expenseCategories)

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

export const moneySchema = z
  .number({ invalid_type_error: 'Tiene que ser un número' })
  .finite()
  .gt(0, 'Tiene que ser mayor a 0')

export const optionalNotes = z.string().max(500).optional().nullable()

// Income — sueldo
export const incomeSchema = z.object({
  date: dateSchema,
  beneficiary: ownerSchema,
  amountUsd: moneySchema,
  walletId: z.string().uuid(),
  notes: optionalNotes,
})
export type IncomeInput = z.infer<typeof incomeSchema>

// Purchase — compra USD
export const purchaseSchema = z.object({
  date: dateSchema,
  amountArs: moneySchema,
  exchangeRate: moneySchema,
  walletId: z.string().uuid(),
  notes: optionalNotes,
})
export type PurchaseInput = z.infer<typeof purchaseSchema>

// Expense — egreso multi-bolsillo
export const expenseLegSchema = z.object({
  walletId: z.string().uuid(),
  amountUsd: moneySchema,
})

export const expenseSchema = z
  .object({
    date: dateSchema,
    description: z.string().min(1).max(200),
    category: expenseCategorySchema,
    totalUsd: moneySchema,
    legs: z.array(expenseLegSchema).min(1),
    notes: optionalNotes,
  })
  .refine(
    (data) => {
      const sum = data.legs.reduce((s, l) => s + l.amountUsd, 0)
      return Math.abs(sum - data.totalUsd) < 0.01
    },
    { message: 'La suma de los orígenes no coincide con el total', path: ['legs'] },
  )
export type ExpenseInput = z.infer<typeof expenseSchema>

// Transfer
export const transferSchema = z
  .object({
    date: dateSchema,
    fromWalletId: z.string().uuid(),
    toWalletId: z.string().uuid(),
    amountUsd: moneySchema,
    notes: optionalNotes,
  })
  .refine((d) => d.fromWalletId !== d.toWalletId, {
    message: 'No podés transferir al mismo bolsillo',
    path: ['toWalletId'],
  })
export type TransferInput = z.infer<typeof transferSchema>

// Cash out — extracción a físico
export const cashOutSchema = z
  .object({
    date: dateSchema,
    fromWalletId: z.string().uuid(),
    toWalletId: z.string().uuid(),
    grossAmount: moneySchema,
    feePercentage: z
      .number()
      .min(0, 'No puede ser negativo')
      .max(20, 'Demasiado alta'),
    notes: optionalNotes,
  })
  .refine((d) => d.fromWalletId !== d.toWalletId, {
    message: 'Origen y destino deben ser distintos',
    path: ['toWalletId'],
  })
export type CashOutInput = z.infer<typeof cashOutSchema>

// Loan out
export const loanOutSchema = z
  .object({
    date: dateSchema,
    debtorName: z.string().min(1).max(100),
    totalUsd: moneySchema,
    dueDate: dateSchema.optional().nullable(),
    legs: z.array(expenseLegSchema).min(1),
    notes: optionalNotes,
  })
  .refine(
    (data) => {
      const sum = data.legs.reduce((s, l) => s + l.amountUsd, 0)
      return Math.abs(sum - data.totalUsd) < 0.01
    },
    { message: 'La suma de los orígenes no coincide con el total', path: ['legs'] },
  )
export type LoanOutInput = z.infer<typeof loanOutSchema>

// Loan in — cobro
export const loanInSchema = z
  .object({
    date: dateSchema,
    loanId: z.string().uuid(),
    totalUsd: moneySchema,
    legs: z.array(expenseLegSchema).min(1),
    notes: optionalNotes,
  })
  .refine(
    (data) => {
      const sum = data.legs.reduce((s, l) => s + l.amountUsd, 0)
      return Math.abs(sum - data.totalUsd) < 0.01
    },
    { message: 'La suma de los destinos no coincide con el total', path: ['legs'] },
  )
export type LoanInInput = z.infer<typeof loanInSchema>
