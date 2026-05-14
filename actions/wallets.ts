'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { wallets } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { walletSchema, type WalletInput } from '@/lib/validations/wallet'

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }

export async function createWallet(input: WalletInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    const data = walletSchema.parse(input)
    await db.insert(wallets).values({
      name: data.name,
      type: data.type,
      owner: data.owner,
      initialBalance: data.initialBalance.toFixed(2),
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder,
    })
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function archiveWallet(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    await db.update(wallets).set({ isActive: false }).where(eq(wallets.id, id))
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
