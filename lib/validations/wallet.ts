import { z } from 'zod'

export const walletSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['virtual', 'physical', 'receivable']),
  owner: z.enum(['fede', 'flor', 'joint']),
  initialBalance: z.number().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().max(50),
  sortOrder: z.number().int().min(0),
})

export type WalletInput = z.infer<typeof walletSchema>
