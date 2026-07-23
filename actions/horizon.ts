'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  horizonContributions,
  horizonPlans,
  horizonValuations,
} from '@/lib/db/schema'
import {
  horizonContributionSchema,
  horizonValuationSchema,
  type HorizonContributionInput,
  type HorizonValuationInput,
} from '@/lib/validations/horizon'
import {
  ensureHorizonInitialData,
  HORIZON_PLAN_SLUG,
} from '@/lib/services/horizonBootstrap'
import { and, desc, eq, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  return session.user.id
}

async function getPlan() {
  await ensureHorizonInitialData()
  const [plan] = await db
    .select()
    .from(horizonPlans)
    .where(eq(horizonPlans.slug, HORIZON_PLAN_SLUG))
    .limit(1)
  if (!plan) throw new Error('Plan Horizonte no encontrado')
  return plan
}

export async function createHorizonContribution(
  input: HorizonContributionInput,
): Promise<ActionResult> {
  try {
    const userId = await requireUser()
    const data = horizonContributionSchema.parse(input)
    const plan = await getPlan()

    const [valuation] = await db
      .select()
      .from(horizonValuations)
      .where(
        and(
          eq(horizonValuations.planId, plan.id),
          eq(horizonValuations.kind, 'official_plan'),
          lte(horizonValuations.effectiveOn, data.paidOn),
        ),
      )
      .orderBy(desc(horizonValuations.effectiveOn))
      .limit(1)

    const includedInOpeningSnapshot = data.paidOn <= plan.openingSnapshotOn
    if (!includedInOpeningSnapshot && !valuation) {
      throw new Error('Primero cargá el valor vigente del plan para esa fecha')
    }

    const officialValue = valuation ? Number(valuation.amountArs) : null
    const acquiredPercentage =
      officialValue && officialValue > 0
        ? (data.housingAmountArs / officialValue) * 100
        : null

    await db.insert(horizonContributions).values({
      planId: plan.id,
      paidOn: data.paidOn,
      creditedOn: data.creditedOn || null,
      grossAmountArs: data.grossAmountArs.toFixed(2),
      expensesAmountArs: data.expensesAmountArs.toFixed(2),
      housingAmountArs: data.housingAmountArs.toFixed(2),
      officialHomeValueArs: officialValue?.toFixed(2) ?? null,
      acquiredPercentage: acquiredPercentage?.toFixed(8) ?? null,
      paymentMethod: data.paymentMethod,
      transferFrom: data.paymentMethod === 'transfer' ? data.transferFrom : null,
      receiptReference: data.receiptReference || null,
      countsForSeniority: data.countsForSeniority,
      includedInOpeningSnapshot,
      notes: data.notes || null,
      createdBy: userId,
    })

    revalidatePath('/horizon')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar el aporte',
    }
  }
}

export async function createHorizonValuation(
  input: HorizonValuationInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = horizonValuationSchema.parse(input)
    const plan = await getPlan()

    await db.transaction(async (tx) => {
      const rows = [
        {
          planId: plan.id,
          effectiveOn: data.effectiveOn,
          kind: 'official_plan' as const,
          typology: plan.officialTypology,
          amountArs: data.officialAmountArs.toFixed(2),
          notes: data.notes || null,
        },
        {
          planId: plan.id,
          effectiveOn: data.effectiveOn,
          kind: 'target_home' as const,
          typology: plan.targetTypology,
          amountArs: data.targetAmountArs.toFixed(2),
          notes: data.notes || null,
        },
      ]

      for (const row of rows) {
        await tx
          .insert(horizonValuations)
          .values(row)
          .onConflictDoUpdate({
            target: [
              horizonValuations.planId,
              horizonValuations.kind,
              horizonValuations.effectiveOn,
            ],
            set: {
              typology: row.typology,
              amountArs: row.amountArs,
              notes: row.notes,
            },
          })
      }
    })

    revalidatePath('/horizon')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron actualizar los valores',
    }
  }
}

export async function deleteHorizonContribution(id: string): Promise<ActionResult> {
  try {
    await requireUser()
    const [contribution] = await db
      .select()
      .from(horizonContributions)
      .where(eq(horizonContributions.id, id))
      .limit(1)
    if (!contribution) throw new Error('Aporte no encontrado')
    if (contribution.importKey) {
      throw new Error('Los aportes importados forman parte del saldo inicial')
    }

    await db.delete(horizonContributions).where(eq(horizonContributions.id, id))
    revalidatePath('/horizon')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo eliminar el aporte',
    }
  }
}
