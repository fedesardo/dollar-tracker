import 'server-only'

import { db } from '@/lib/db'
import { householdItemAmounts, householdItems } from '@/lib/db/schema'
import { getCarLoanDashboard } from '@/lib/queries/carLoan'
import { ensureHouseholdInitialData } from '@/lib/services/householdBootstrap'
import { getCurrentRates } from '@/lib/services/dolar'
import { currentAmount, monthOf, type AmountPoint } from '@/lib/utils/household'
import { asc, eq } from 'drizzle-orm'

export type HouseholdItemView = {
  id: string
  name: string
  groupKey: string
  currency: 'ARS' | 'USD'
  monthsPerCharge: number
  linked: boolean
  notes: string | null
  /** Monto de cada cobro vigente; null si falta cargarlo. */
  amount: number | null
  effectiveFrom: string | null
  history: AmountPoint[]
  /** Cuota BYD: crédito + IVA por mes de vencimiento ('YYYY-MM'). */
  linkedByMonth: Record<string, number> | null
}

export async function getHouseholdDashboard() {
  await ensureHouseholdInitialData()

  const [items, amounts, rates, carLoan] = await Promise.all([
    db
      .select()
      .from(householdItems)
      .where(eq(householdItems.active, true))
      .orderBy(asc(householdItems.sortOrder), asc(householdItems.createdAt)),
    db.select().from(householdItemAmounts),
    getCurrentRates(),
    getCarLoanDashboard(),
  ])

  const month = monthOf(new Date())
  const pointsByItem = new Map<string, AmountPoint[]>()
  for (const row of amounts) {
    const list = pointsByItem.get(row.itemId) ?? []
    list.push({ effectiveFrom: row.effectiveFrom, amount: Number(row.amount) })
    pointsByItem.set(row.itemId, list)
  }

  const views: HouseholdItemView[] = items.map((item) => {
    const history = (pointsByItem.get(item.id) ?? []).sort((a, b) =>
      b.effectiveFrom.localeCompare(a.effectiveFrom),
    )
    const linked = item.source === 'car_loan'
    const current = linked ? null : currentAmount(history, month)
    const linkedByMonth = linked
      ? Object.fromEntries(
          carLoan.metrics.rows.map((row) => [row.dueOn.slice(0, 7), row.creditTotal]),
        )
      : null
    return {
      id: item.id,
      name: item.name,
      groupKey: item.groupKey,
      currency: item.currency === 'USD' ? 'USD' : 'ARS',
      monthsPerCharge: item.monthsPerCharge,
      linked,
      notes: item.notes,
      // Cuota BYD: crédito + IVA de la próxima cuota (el seguro va aparte).
      amount: linked
        ? (linkedByMonth?.[month] ?? carLoan.metrics.next?.creditTotal ?? 0)
        : (current?.amount ?? null),
      effectiveFrom: current?.effectiveFrom ?? null,
      history,
      linkedByMonth,
    }
  })

  return { items: views, usdRate: rates.blue?.venta ?? null, month }
}
