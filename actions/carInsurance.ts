'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { carInsurancePolicies } from '@/lib/db/schema'
import {
  carInsuranceOfferSchema,
  type CarInsuranceOfferInput,
} from '@/lib/validations/carInsurance'
import { normalizeCoverages, type CoverageMap } from '@/lib/utils/carInsurance'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
}

const revalidateAll = () => revalidatePath('/car-loan')
const fail = (error: unknown, fallback: string): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : fallback,
})

function toRow(data: CarInsuranceOfferInput) {
  return {
    insurer: data.insurer,
    planName: data.planName,
    monthlyPremiumArs: data.monthlyPremiumArs?.toFixed(2) ?? null,
    validFrom: data.validFrom,
    insuredSumArs: data.insuredSumArs?.toFixed(2) ?? null,
    notes: data.notes || null,
    coverages: normalizeCoverages(data.coverages as CoverageMap),
    updatedAt: new Date(),
  }
}

export async function createCarInsuranceOffer(
  input: CarInsuranceOfferInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = carInsuranceOfferSchema.parse(input)
    await db.insert(carInsurancePolicies).values({ kind: 'offer', ...toRow(data) })
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo guardar la oferta')
  }
}

export async function updateCarInsuranceOffer(
  id: string,
  input: CarInsuranceOfferInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = carInsuranceOfferSchema.parse(input)
    const updated = await db
      .update(carInsurancePolicies)
      .set(toRow(data))
      .where(and(eq(carInsurancePolicies.id, id), eq(carInsurancePolicies.kind, 'offer')))
      .returning({ id: carInsurancePolicies.id })
    if (updated.length === 0) throw new Error('Oferta no encontrada')
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo actualizar la oferta')
  }
}

export async function deleteCarInsuranceOffer(id: string): Promise<ActionResult> {
  try {
    await requireUser()
    await db
      .delete(carInsurancePolicies)
      .where(and(eq(carInsurancePolicies.id, id), eq(carInsurancePolicies.kind, 'offer')))
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo borrar la oferta')
  }
}
