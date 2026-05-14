'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { loans, transactions } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

type ActionResult = { success: true } | { success: false; error: string }

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/loans')
  revalidatePath('/transactions')
  revalidatePath('/portfolio')
  revalidatePath('/stats')
}

export async function writeOffLoan(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    await db
      .update(loans)
      .set({ status: 'written_off', updatedAt: new Date() })
      .where(eq(loans.id, id))
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

/**
 * Elimina un préstamo y revierte todos sus movimientos asociados.
 * - Borra la transacción origen (loan_out) y sus legs → la plata vuelve a los wallets
 * - Borra todas las transacciones de cobro (loan_in con groupId == loan.id) y sus legs → revierte los cobros
 * - Borra el registro del préstamo
 */
export async function deleteLoan(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    await db.transaction(async (tx) => {
      const [loan] = await tx.select().from(loans).where(eq(loans.id, id))
      if (!loan) throw new Error('Préstamo no encontrado')

      // Borrar transacciones de cobro (los legs caen por cascade)
      await tx.delete(transactions).where(eq(transactions.groupId, id))

      // Borrar transacción origen si existe
      if (loan.transactionId) {
        await tx.delete(transactions).where(eq(transactions.id, loan.transactionId))
      }

      // Borrar el préstamo
      await tx.delete(loans).where(eq(loans.id, id))
    })

    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
