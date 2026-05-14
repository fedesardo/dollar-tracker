import { getActiveWallets } from '@/lib/queries/wallets'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import {
  calcAllWalletBalances,
  calcMonthMetrics,
  calcMonthlyEvolution,
  type LegWithDirection,
} from '@/lib/utils/calculations'
import { toNumber } from '@/lib/utils/format'
import { DistributionChart, type DistributionSlice } from '@/components/portfolio/DistributionChart'
import { ArsValuePanel } from '@/components/portfolio/ArsValuePanel'
import { ProjectionChart, type ProjectionPoint } from '@/components/portfolio/ProjectionChart'
import { DistributionEvolution, type EvoStack } from '@/components/portfolio/DistributionEvolution'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  const [wallets, txs] = await Promise.all([
    getActiveWallets(),
    getAllTransactionsWithLegs(),
  ])

  const allLegs: LegWithDirection[] = txs.flatMap((t) =>
    t.legs.map((l) => ({ walletId: l.walletId, direction: l.direction, amountUsd: l.amountUsd })),
  )
  const balances = calcAllWalletBalances(wallets, allLegs)
  const total = Array.from(balances.values()).reduce((s, v) => s + v, 0)

  const byType = { virtual: 0, physical: 0, receivable: 0 }
  for (const w of wallets) {
    const b = balances.get(w.id) ?? 0
    byType[w.type] += b
  }
  const slices: DistributionSlice[] = [
    {
      name: 'Virtual',
      value: byType.virtual,
      color: '#60a5fa',
      pct: total > 0 ? (byType.virtual / total) * 100 : 0,
    },
    {
      name: 'Físico',
      value: byType.physical,
      color: '#34d399',
      pct: total > 0 ? (byType.physical / total) * 100 : 0,
    },
    {
      name: 'Pendiente',
      value: byType.receivable,
      color: '#a78bfa',
      pct: total > 0 ? (byType.receivable / total) * 100 : 0,
    },
  ]
  const lostFees = txs
    .filter((t) => t.type === 'cash_out')
    .reduce((s, t) => s + toNumber(t.feeUsd), 0)

  // Projection
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const txsPlain = txs.map((t) => ({ ...t, legs: undefined }) as unknown as import('@/lib/db/schema').Transaction)

  // Last sueldo de Flor proyectado * 12 / 12 = proxy mensual
  const lastFlorIncome = txsPlain.find((t) => t.type === 'income' && t.beneficiary === 'flor')
  const monthlyIncome = lastFlorIncome ? toNumber(lastFlorIncome.amountUsd) : 2200

  // Egreso promedio últimos 3 meses
  let exp3 = 0
  let exp3n = 0
  let pur6 = 0
  let pur6n = 0
  for (let i = 1; i <= 6; i++) {
    const ref = new Date(y, m - 1 - i, 1)
    const mm = ref.getMonth() + 1
    const yy = ref.getFullYear()
    const past = calcMonthMetrics(txsPlain, yy, mm)
    if (i <= 3 && past.expense > 0) {
      exp3 += past.expense
      exp3n++
    }
    if (past.purchaseUsd > 0) {
      pur6 += past.purchaseUsd
      pur6n++
    }
  }
  const avgExpense = exp3n > 0 ? exp3 / exp3n : 0
  const avgPurchaseUsd = pur6n > 0 ? pur6 / pur6n : 0
  const monthlyDelta = monthlyIncome + avgPurchaseUsd - avgExpense

  // Build projection: 11 months past actuals + 12 months projected
  const evolution = calcMonthlyEvolution(wallets, txs, 11)
  const projection: ProjectionPoint[] = evolution.map((e) => ({
    label: e.label,
    actual: e.total,
    projected: null,
  }))
  // Bridge point at current month
  const lastActual = projection[projection.length - 1]
  let running = lastActual?.actual ?? total
  for (let i = 1; i <= 12; i++) {
    running += monthlyDelta
    const d = new Date(y, m - 1 + i, 1)
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    const variance = Math.abs(monthlyDelta) * 0.5 * i
    projection.push({
      label,
      actual: null,
      projected: running,
      band: [running - variance, running + variance],
    })
  }
  if (lastActual) {
    // ensure projected line visually starts from last actual
    lastActual.projected = lastActual.actual
  }

  // Distribution evolution stack
  const stackEvo: EvoStack[] = evolution.map((e) => {
    const stack = { virtual: 0, physical: 0, receivable: 0 }
    for (const w of wallets) {
      const v = e.byWallet[w.id] ?? 0
      stack[w.type] += v
    }
    return { label: e.label, ...stack }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Portfolio</h1>
        <p className="text-sm text-text-muted mt-1">
          Cómo está repartida la guita y a dónde puede ir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionChart slices={slices} lostFees={lostFees} />
        <ArsValuePanel totalUsd={total} />
      </div>

      <ProjectionChart data={projection} monthlyDelta={monthlyDelta} />
      <DistributionEvolution data={stackEvo} />
    </div>
  )
}
