import { getActiveWallets } from '@/lib/queries/wallets'
import { getActiveGoals } from '@/lib/queries/goals'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import { calcAllWalletBalances, calcMonthMetrics, type LegWithDirection } from '@/lib/utils/calculations'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalsActions } from '@/components/goals/GoalsHeader'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const [wallets, txs, goals] = await Promise.all([
    getActiveWallets(),
    getAllTransactionsWithLegs(),
    getActiveGoals(),
  ])

  const allLegs: LegWithDirection[] = txs.flatMap((t) =>
    t.legs.map((l) => ({ walletId: l.walletId, direction: l.direction, amountUsd: l.amountUsd })),
  )
  const balances = calcAllWalletBalances(wallets, allLegs)
  const total = Array.from(balances.values()).reduce((s, v) => s + v, 0)

  // Monthly delta from last 6m
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const txsPlain = txs.map((t) => ({ ...t, legs: undefined }) as unknown as import('@/lib/db/schema').Transaction)
  let savingsTotal = 0
  let count = 0
  for (let i = 1; i <= 6; i++) {
    const ref = new Date(y, m - 1 - i, 1)
    const past = calcMonthMetrics(txsPlain, ref.getFullYear(), ref.getMonth() + 1)
    if (past.income > 0 || past.expense > 0 || past.purchaseUsd > 0) {
      savingsTotal += past.netSavings
      count++
    }
  }
  const monthlyDelta = count > 0 ? savingsTotal / count : 0

  return (
    <div className="space-y-5">
      <GoalsActions empty={goals.length === 0} />
      {goals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} totalUsd={total} monthlyDelta={monthlyDelta} />
          ))}
        </div>
      )}
    </div>
  )
}
