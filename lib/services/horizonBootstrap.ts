import 'server-only'

import { db } from '@/lib/db'
import {
  horizonContributions,
  horizonPlans,
  horizonValuations,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const HORIZON_PLAN_SLUG = 'casita-horizonte'

const HISTORICAL_CONTRIBUTIONS = [
  ['2026-02-08', '600000.00', '44000.00', '556000.00', 'Primer aporte'],
  ['2026-03-02', '800000.00', '44000.00', '756000.00', 'Primer aporte'],
  ['2026-04-01', '700000.00', '44000.00', '656000.00', 'Primer aporte'],
  ['2026-05-02', '925000.00', '44000.00', '881000.00', 'Primer aporte'],
  ['2026-06-10', '400000.00', '44000.00', '356000.00', 'Primer aporte'],
  ['2026-07-10', '700000.00', '44000.00', '656000.00', 'Primer aporte'],
] as const

/**
 * One-time, idempotent import of the workbook and the official opening snapshot.
 * It runs on first access so the production database receives the agreed baseline
 * after the schema migration, without touching any USD domain table.
 */
export async function ensureHorizonInitialData() {
  await db
    .insert(horizonPlans)
    .values({
      slug: HORIZON_PLAN_SLUG,
      name: 'Casita Horizonte',
      provider: 'Cooperativa Horizonte',
      memberNumber: '89082',
      startedOn: '2026-02-01',
      officialTypology: 'D30/0/D',
      targetTypology: 'B68/0/L',
      targetDescription: 'Vivienda Standard, 2 dormitorios, lote largo de 250 m²',
      targetLotSqm: 250,
      openingSnapshotOn: '2026-07-23',
      openingOfficialPercentage: '7.252700',
      pointsPerActiveMonth: '1.50',
      pointsPerPercentage: '2.00',
    })
    .onConflictDoNothing({ target: horizonPlans.slug })

  const [plan] = await db
    .select()
    .from(horizonPlans)
    .where(eq(horizonPlans.slug, HORIZON_PLAN_SLUG))
    .limit(1)

  if (!plan) throw new Error('No se pudo inicializar Casita Horizonte')

  await db
    .insert(horizonValuations)
    .values([
      {
        planId: plan.id,
        effectiveOn: '2026-02-01',
        kind: 'target_home',
        typology: 'B68/0/L',
        amountArs: '95450523.88',
        notes: 'Valor histórico importado del Excel.',
        importKey: 'horizon-target-2026-02',
      },
      {
        planId: plan.id,
        effectiveOn: '2026-07-14',
        kind: 'official_plan',
        typology: 'D30/0/D',
        amountArs: '57503033.77',
        notes: 'Estado 531, vigente del 14/07/2026 al 13/08/2026.',
        importKey: 'horizon-official-state-531',
      },
      {
        planId: plan.id,
        effectiveOn: '2026-07-14',
        kind: 'target_home',
        typology: 'B68/0/L',
        amountArs: '113484848.03',
        notes: 'Lista de valores actualizada al 13/08/2026.',
        importKey: 'horizon-target-state-531',
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(horizonContributions)
    .values(
      HISTORICAL_CONTRIBUTIONS.map(([paidOn, gross, expenses, housing, notes]) => ({
        planId: plan.id,
        paidOn,
        grossAmountArs: gross,
        expensesAmountArs: expenses,
        housingAmountArs: housing,
        paymentMethod: null,
        countsForSeniority: true,
        includedInOpeningSnapshot: true,
        notes,
        importKey: `horizon-excel-${paidOn}`,
      })),
    )
    .onConflictDoNothing()

  return plan
}
