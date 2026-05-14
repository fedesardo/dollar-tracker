import { getActiveWallets } from '@/lib/queries/wallets'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import { calcMonthMetrics, calcMonthlyEvolution } from '@/lib/utils/calculations'
import { toNumber } from '@/lib/utils/format'
import { MonthlyStatsTable, type MonthlyRow } from '@/components/stats/MonthlyStatsTable'
import { SavingsRateChart, type SavingsRow } from '@/components/stats/SavingsRateChart'
import { CategoryPie, type CatRow } from '@/components/stats/CategoryPie'
import { YearComparison, type YearRow } from '@/components/stats/YearComparison'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

export default async function StatsPage() {
  const [wallets, txs] = await Promise.all([getActiveWallets(), getAllTransactionsWithLegs()])
  const txsPlain = txs.map((t) => ({ ...t, legs: undefined }) as unknown as import('@/lib/db/schema').Transaction)

  // Compute the months range we have any tx in
  const monthsSet = new Set<string>()
  for (const t of txsPlain) {
    const d = new Date(t.date + 'T00:00:00')
    monthsSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  }
  const today = new Date()
  monthsSet.add(`${today.getFullYear()}-${today.getMonth() + 1}`)
  const monthList = Array.from(monthsSet)
    .map((s) => {
      const [y, m] = s.split('-').map(Number)
      return { y, m }
    })
    .sort((a, b) => (a.y === b.y ? a.m - b.m : a.y - b.y))

  // Monthly evolution (running balance) for the column "Saldo total"
  const monthsBack = Math.max(11, monthList.length - 1)
  const evolution = calcMonthlyEvolution(wallets, txs, monthsBack)
  const balanceByKey = new Map(evolution.map((e) => [`${e.year}-${e.month}`, e.total]))

  const rows: MonthlyRow[] = monthList.map(({ y, m }) => {
    const metrics = calcMonthMetrics(txsPlain, y, m)
    return {
      year: y,
      month: m,
      income: metrics.income,
      purchase: metrics.purchaseUsd,
      arsSpent: metrics.purchaseArs,
      totalIncome: metrics.income + metrics.purchaseUsd,
      expense: metrics.expense,
      fees: metrics.cashOutFees,
      netSavings: metrics.netSavings,
      totalBalance: balanceByKey.get(`${y}-${m}`) ?? 0,
    }
  }).reverse()

  // Savings rate
  const savings: SavingsRow[] = rows
    .slice(0, 12)
    .reverse()
    .map((r) => {
      const denom = r.totalIncome
      const rate = denom > 0 ? (r.netSavings / denom) * 100 : 0
      return { label: `${MONTH_NAMES[r.month - 1]} '${String(r.year).slice(-2)}`, rate }
    })
  const savingsAvg =
    savings.length > 0 ? savings.reduce((s, r) => s + r.rate, 0) / savings.length : 0

  // Category breakdown (full history)
  const catMap = new Map<string, number>()
  for (const t of txsPlain) {
    if (t.type !== 'expense') continue
    const cat = t.category || 'Otro'
    catMap.set(cat, (catMap.get(cat) ?? 0) + toNumber(t.amountUsd))
  }
  const cats: CatRow[] = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Year comparison
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b)
  const yearData: YearRow[] = MONTH_NAMES.map((m, i) => {
    const row: YearRow = { month: m }
    for (const y of years) {
      const found = rows.find((r) => r.year === y && r.month === i + 1)
      row[String(y)] = found?.netSavings ?? 0
    }
    return row
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Estadísticas</h1>
        <p className="text-sm text-text-muted mt-1">
          Los números, fríos y bien tabulados.
        </p>
      </div>

      <MonthlyStatsTable rows={rows} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SavingsRateChart data={savings} average={savingsAvg} />
        <CategoryPie data={cats} />
      </div>

      <YearComparison data={yearData} years={years} />
    </div>
  )
}
