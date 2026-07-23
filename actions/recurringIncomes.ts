'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { recurringIncomes } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import {
  recurringIncomeSchema,
  type RecurringIncomeInput,
} from '@/lib/validations/recurringIncome'

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  return session.user.id
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/settings')
  revalidatePath('/transactions')
}

export async function createRecurringIncome(
  input: RecurringIncomeInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser()
    const data = recurringIncomeSchema.parse(input)

    const [created] = await db
      .insert(recurringIncomes)
      .values({
        description: data.description,
        beneficiary: data.beneficiary,
        walletId: data.walletId,
        amountUsd: data.amountUsd.toFixed(2),
        dayOfMonth: data.dayOfMonth,
        isActive: data.isActive,
        notes: data.notes ?? null,
      })
      .returning({ id: recurringIncomes.id })

    revalidateAll()
    return { success: true, data: { id: created.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function updateRecurringIncome(
  id: string,
  input: RecurringIncomeInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = recurringIncomeSchema.parse(input)

    await db
      .update(recurringIncomes)
      .set({
        description: data.description,
        beneficiary: data.beneficiary,
        walletId: data.walletId,
        amountUsd: data.amountUsd.toFixed(2),
        dayOfMonth: data.dayOfMonth,
        isActive: data.isActive,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(recurringIncomes.id, id))

    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function toggleRecurringIncome(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await requireUser()
    await db
      .update(recurringIncomes)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(recurringIncomes.id, id))
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function deleteRecurringIncome(id: string): Promise<ActionResult> {
  try {
    await requireUser()
    await db.delete(recurringIncomes).where(eq(recurringIncomes.id, id))
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
