import 'server-only'

import { db } from '@/lib/db'
import {
  horizonContributions,
  horizonPlans,
  horizonValuations,
} from '@/lib/db/schema'
import { calculateHorizonMetrics } from '@/lib/utils/horizon'
import {
  ensureHorizonInitialData,
  HORIZON_PLAN_SLUG,
} from '@/lib/services/horizonBootstrap'
import { asc, desc, eq } from 'drizzle-orm'

export async function getHorizonDashboard() {
  await ensureHorizonInitialData()

  const [plan] = await db
    .select()
    .from(horizonPlans)
    .where(eq(horizonPlans.slug, HORIZON_PLAN_SLUG))
    .limit(1)
  if (!plan) throw new Error('Plan Horizonte no encontrado')

  const [valuations, contributions] = await Promise.all([
    db
      .select()
      .from(horizonValuations)
      .where(eq(horizonValuations.planId, plan.id))
      .orderBy(asc(horizonValuations.effectiveOn)),
    db
      .select()
      .from(horizonContributions)
      .where(eq(horizonContributions.planId, plan.id))
      .orderBy(desc(horizonContributions.paidOn), desc(horizonContributions.createdAt)),
  ])

  const asOf = new Date().toISOString().slice(0, 10)
  const metrics = calculateHorizonMetrics(plan, valuations, contributions, asOf)

  return { plan, valuations, contributions, metrics, asOf }
}
