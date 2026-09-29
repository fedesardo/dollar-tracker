import 'server-only'

import { db } from '@/lib/db'
import { carInsurancePolicies } from '@/lib/db/schema'
import { ensureCurrentInsuranceData } from '@/lib/services/carInsuranceBootstrap'
import { normalizeCoverages } from '@/lib/utils/carInsurance'
import { asc } from 'drizzle-orm'

export async function getCarInsuranceDashboard() {
  await ensureCurrentInsuranceData()
  const rows = await db
    .select()
    .from(carInsurancePolicies)
    .orderBy(asc(carInsurancePolicies.kind), asc(carInsurancePolicies.createdAt))

  const policies = rows.map((row) => ({
    ...row,
    coverages: normalizeCoverages(row.coverages),
  }))
  const current = policies.find((p) => p.kind === 'current')
  if (!current) throw new Error('No se pudo cargar la póliza vigente')
  const offers = policies.filter((p) => p.kind === 'offer')
  return { current, offers }
}
