'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { householdItemAmounts, householdItems } from '@/lib/db/schema'
import {
  householdCreateSchema,
  householdSaveSchema,
  type HouseholdCreateInput,
  type HouseholdSaveInput,
} from '@/lib/validations/household'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
}

const revalidateAll = () => revalidatePath('/hogar')
const fail = (error: unknown, fallback: string): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : fallback,
})

async function upsertAmount(
  tx: Pick<typeof db, 'insert'>,
  itemId: string,
  month: string,
  amount: number,
) {
  const effectiveFrom = `${month}-01`
  await tx
    .insert(householdItemAmounts)
    .values({ itemId, effectiveFrom, amount: amount.toFixed(2) })
    .onConflictDoUpdate({
      target: [householdItemAmounts.itemId, householdItemAmounts.effectiveFrom],
      set: { amount: amount.toFixed(2) },
    })
}

/** Actualiza el monto de un concepto desde `month` en adelante (y su frecuencia). */
export async function saveHouseholdItem(input: HouseholdSaveInput): Promise<ActionResult> {
  try {
    await requireUser()
    const data = householdSaveSchema.parse(input)
    await db.transaction(async (tx) => {
      await tx
        .update(householdItems)
        .set({ monthsPerCharge: data.monthsPerCharge })
        .where(eq(householdItems.id, data.itemId))
      if (data.amount !== null) await upsertAmount(tx, data.itemId, data.month, data.amount)
    })
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo guardar')
  }
}

export async function createHouseholdItem(input: HouseholdCreateInput): Promise<ActionResult> {
  try {
    await requireUser()
    const data = householdCreateSchema.parse(input)
    await db.transaction(async (tx) => {
      const [item] = await tx
        .insert(householdItems)
        .values({
          name: data.name,
          groupKey: data.groupKey,
          currency: data.currency,
          monthsPerCharge: data.monthsPerCharge,
          sortOrder: 1000,
        })
        .returning({ id: householdItems.id })
      if (data.amount !== null) await upsertAmount(tx, item.id, data.month, data.amount)
    })
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo crear el concepto')
  }
}

/** Saca el concepto de la estructura (queda guardado, no se borra el historial). */
export async function archiveHouseholdItem(id: string): Promise<ActionResult> {
  try {
    await requireUser()
    await db.update(householdItems).set({ active: false }).where(eq(householdItems.id, id))
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo dar de baja')
  }
}
