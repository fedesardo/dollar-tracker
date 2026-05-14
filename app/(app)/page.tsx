import { getActiveWallets } from '@/lib/queries/wallets'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import { getAllLoans } from '@/lib/queries/loans'
import { getCurrentRates, getMonthlyBlueClose, getBlueHistory } from '@/lib/services/dolar'
import { calcAllWalletBalances, calcMonthMetrics, calcMonthlyEvolution, previousMonth, type LegWithDirection } from '@/lib/utils/calculations'
import { generateInsights } from '@/lib/utils/insights'
import { toNumber } from '@/lib/utils/format'
import { HeroTotal } from '@/components/dashboard/HeroTotal'
import { WalletCard, type WalletCardData } from '@/components/dashboard/WalletCard'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { InsightPanel } from '@/components/dashboard/InsightPanel'
import { EvolutionChart } from '@/components/dashboard/EvolutionChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { QuickSalaryPrompt } from '@/components/dashboard/QuickSalaryPrompt'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const [wallets, txs, loans, rates, monthlyBlue, blueHistoryRaw] = await Promise.all([
    getActiveWallets(),
    getAllTransactionsWithLegs(),
    getAllLoans(),
    getCurrentRates(),
    getMonthlyBlueClose(12),
    getBlueHistory(60),
  ])

  const allLegs: LegWithDirection[] = txs.flatMap((t) =>
    t.legs.map((l) => ({ walletId: l.walletId, direction: l.direction, amountUsd: l.amountUsd })),
  )
  const balances = calcAllWalletBalances(wallets, allLegs)
  const totalUsd = Array.from(balances.values()).reduce((s, v) => s + v, 0)

  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const prev = previousMonth(y, m)

  // Previous-month total
  const prevAllLegs: LegWithDirection[] = txs
    .filter((t) => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getFullYear() < prev.year || (d.getFullYear() === prev.year && d.getMonth() + 1 <= prev.month)
    })
    .flatMap((t) =>
      t.legs.map((l) => ({ walletId: l.walletId, direction: l.direction, amountUsd: l.amountUsd })),
    )
  const prevBalances = calcAllWalletBalances(wallets, prevAllLegs)
  const prevTotal = Array.from(prevBalances.values()).reduce((s, v) => s + v, 0)
  const monthDelta = totalUsd - prevTotal
  const monthDeltaPct = prevTotal !== 0 ? (monthDelta / Math.abs(prevTotal)) * 100 : 0

  const txsPlain = txs.map((t) => ({ ...t, legs: undefined }) as unknown as import('@/lib/db/schema').Transaction)
  const curMetrics = calcMonthMetrics(txsPlain, y, m)
  const prevMetrics = calcMonthMetrics(txsPlain, prev.year, prev.month)
  const expenseDeltaPct =
    prevMetrics.expense > 0 ? ((curMetrics.expense - prevMetrics.expense) / prevMetrics.expense) * 100 : null

  // 6-month avg net savings
  let savingsTotal = 0
  let savingsCount = 0
  for (let i = 1; i <= 6; i++) {
    const dRef = new Date(y, m - 1 - i, 1)
    const mm = dRef.getMonth() + 1
    const yy = dRef.getFullYear()
    const past = calcMonthMetrics(txsPlain, yy, mm)
    if (past.income > 0 || past.expense > 0 || past.purchaseUsd > 0) {
      savingsTotal += past.netSavings
      savingsCount++
    }
  }
  const avgNetSavings = savingsCount > 0 ? savingsTotal / savingsCount : null

  // Wallet card data
  const walletCardData: WalletCardData[] = wallets.map((w) => {
    const evolution = calcMonthlyEvolution(
      [w],
      txs.filter((t) => t.legs.some((l) => l.walletId === w.id)).map((t) => ({
        ...t,
        legs: t.legs.filter((l) => l.walletId === w.id),
      })),
      8,
    )
    // last movement
    const lastTx = txs.find((t) => t.legs.some((l) => l.walletId === w.id))
    return {
      wallet: w,
      balance: balances.get(w.id) ?? 0,
      prevBalance: prevBalances.get(w.id) ?? toNumber(w.initialBalance),
      history: evolution.map((e) => ({ month: e.label, value: e.byWallet[w.id] ?? e.total })),
      blueRate: rates.blue?.venta ?? null,
      lastMovementAt: lastTx ? new Date(lastTx.createdAt) : null,
    }
  })

  // Evolution chart (overall)
  const evolutionData = calcMonthlyEvolution(wallets, txs, 11)
  const blueByMonth = new Map(monthlyBlue.map((b) => [`${b.year}-${b.month}`, b.value]))
  const evolutionChartData = evolutionData.map((e) => ({
    label: e.label,
    total: e.total,
    blue: blueByMonth.get(`${e.year}-${e.month}`) ?? null,
    byWallet: e.byWallet,
  }))

  // Insights
  const insights = generateInsights({
    wallets,
    legs: allLegs,
    transactions: txsPlain,
    loans,
    blueHistory: blueHistoryRaw,
    blueNow: rates.blue?.venta ?? null,
    totalUsd,
  })

  // Quick salary prompt: day 1-15, no Flor income this month
  const day = today.getDate()
  const florIncomeThisMonth = txsPlain.find((t) => {
    if (t.type !== 'income' || t.beneficiary !== 'flor') return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getFullYear() === y && d.getMonth() + 1 === m
  })
  const showQuickSalary = day <= 15 && !florIncomeThisMonth
  const lastFlorIncome = txsPlain.find((t) => t.type === 'income' && t.beneficiary === 'flor')
  const florWallet = wallets.find((w) => w.owner === 'flor' && w.type === 'virtual')
  const monthName = today.toLocaleDateString('es-AR', { month: 'long' })

  // Average historical purchase rate (weighted)
  let arsT = 0
  let usdT = 0
  for (const t of txsPlain) {
    if (t.type === 'purchase') {
      arsT += toNumber(t.amountArs)
      usdT += toNumber(t.amountUsd)
    }
  }
  const avgHistoricalRate = usdT > 0 ? arsT / usdT : null

  // Average cash_out fee
  const cashOuts = txsPlain.filter((t) => t.type === 'cash_out')
  const avgFeePct =
    cashOuts.length > 0
      ? cashOuts.reduce((s, t) => s + toNumber(t.feePercentage), 0) / cashOuts.length
      : null

  return (
    <div className="space-y-5 stagger">
      <HeroTotal
        total={totalUsd}
        monthDelta={monthDelta}
        monthDeltaPct={monthDeltaPct}
        blueRate={rates.blue?.venta ?? null}
      />

      {showQuickSalary && (
        <QuickSalaryPrompt
          wallets={wallets}
          loans={loans}
          monthName={monthName}
          prefillAmount={lastFlorIncome ? toNumber(lastFlorIncome.amountUsd) : null}
          prefillWalletId={florWallet?.id ?? null}
        />
      )}

      <QuickActions
        wallets={wallets}
        loans={loans}
        avgHistoricalRate={avgHistoricalRate}
        avgFeePct={avgFeePct}
      />

      {insights.length > 0 && <InsightPanel insights={insights} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {walletCardData.map((d) => (
          <WalletCard key={d.wallet.id} data={d} />
        ))}
      </div>

      <MetricsRow
        income={curMetrics.income}
        expense={curMetrics.expense}
        expenseDeltaPct={expenseDeltaPct}
        purchaseUsd={curMetrics.purchaseUsd}
        purchaseArs={curMetrics.purchaseArs}
        avgRate={curMetrics.avgRate}
        netSavings={curMetrics.netSavings}
        avgNetSavings={avgNetSavings}
      />

      <EvolutionChart data={evolutionChartData} wallets={wallets} />
    </div>
  )
}
