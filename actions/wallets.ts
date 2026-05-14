'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { wallets, transactionLegs, transactions, loans } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { walletSchema, type WalletInput } from '@/lib/validations/wallet'

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/transactions')
  revalidatePath('/analysis')
  revalidatePath('/loans')
  revalidatePath('/portfolio')
  revalidatePath('/stats')
  revalidatePath('/settings')
}

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
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function updateWallet(id: string, input: WalletInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    const data = walletSchema.parse(input)
    await db
      .update(wallets)
      .set({
        name: data.name,
        type: data.type,
        owner: data.owner,
        initialBalance: data.initialBalance.toFixed(2),
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder,
      })
      .where(eq(wallets.id, id))
    revalidateAll()
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
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function restoreWallet(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    await db.update(wallets).set({ isActive: true }).where(eq(wallets.id, id))
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

/**
 * Elimina un wallet por completo. Solo permitido si NO tiene transacciones asociadas.
 * Útil para limpiar el wallet "Pendiente Lucho" que se cargó como saldo inicial pero no es un bolsillo real.
 */
export async function deleteWallet(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    // Chequear si tiene legs asociados
    const legs = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionLegs)
      .where(eq(transactionLegs.walletId, id))
    const legCount = Number(legs[0]?.count ?? 0)
    if (legCount > 0) {
      return {
        success: false,
        error: `Este bolsillo tiene ${legCount} movimientos. Archivalo en lugar de eliminarlo.`,
      }
    }

    await db.delete(wallets).where(eq(wallets.id, id))
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

/**
 * Borra TODAS las transacciones, legs y préstamos.
 * NO toca los saldos iniciales de los wallets — esos quedan como están.
 */
export async function resetAllData(): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    await db.transaction(async (tx) => {
      await tx.delete(transactionLegs)
      await tx.delete(transactions)
      await tx.delete(loans)
    })

    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

/**
 * Reset COMPLETO: borra movimientos + setea todos los saldos iniciales a 0.
 * Después el usuario edita cada wallet con su saldo real de hoy.
 */
export async function resetEverythingToZero(): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    await db.transaction(async (tx) => {
      await tx.delete(transactionLegs)
      await tx.delete(transactions)
      await tx.delete(loans)
      await tx.update(wallets).set({ initialBalance: '0' })
    })

    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

