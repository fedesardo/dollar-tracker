import { TrendingUp, Banknote } from 'lucide-react'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import { getActiveWallets } from '@/lib/queries/wallets'
import { getAllLoans } from '@/lib/queries/loans'
import { getCurrentRates, getBlueHistory } from '@/lib/services/dolar'
import { toNumber } from '@/lib/utils/format'
import { AvgRateCard } from '@/components/analysis/AvgRateCard'
import { PurchaseVsBlueChart, type PurchaseDot } from '@/components/analysis/PurchaseVsBlueChart'
import { UsdSimulator } from '@/components/analysis/UsdSimulator'
import { CashOutCostPanel, type CashOutEntry } from '@/components/analysis/CashOutCostPanel'
import { AnalysisEmptyState } from '@/components/analysis/AnalysisEmptyState'

export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
  const [txs, wallets, loans, rates, blueHistory] = await Promise.all([
    getAllTransactionsWithLegs(),
    getActiveWallets(),
    getAllLoans(),
    getCurrentRates(),
    getBlueHistory(365),
  ])

  const purchases = txs.filter((t) => t.type === 'purchase')
  const hasPurchases = purchases.length > 0

  let totalArs = 0
  let totalUsd = 0
  let best: { rate: number; date: string } | null = null
  let worst: { rate: number; date: string } | null = null
  for (const p of purchases) {
    const r = toNumber(p.exchangeRate)
    totalArs += toNumber(p.amountArs)
    totalUsd += toNumber(p.amountUsd)
    if (!best || r < best.rate) best = { rate: r, date: p.date }
    if (!worst || r > worst.rate) worst = { rate: r, date: p.date }
  }
  const avgRate = totalUsd > 0 ? totalArs / totalUsd : null

  // Build PurchaseDot[]
  const blueByDate = new Map(blueHistory.map((b) => [b.date, b.value]))
  const dots: PurchaseDot[] = purchases.map((p) => {
    let blueAtDate = blueByDate.get(p.date)
    if (!blueAtDate) {
      const sorted = blueHistory.filter((b) => b.date <= p.date)
      blueAtDate = sorted[sorted.length - 1]?.value ?? toNumber(p.exchangeRate)
    }
    return {
      date: p.date,
      rate: toNumber(p.exchangeRate),
      blueAtDate,
      arsAmount: toNumber(p.amountArs),
      usdAmount: toNumber(p.amountUsd),
    }
  })

  // Cash outs
  const cashOuts = txs.filter((t) => t.type === 'cash_out')
  const hasCashOuts = cashOuts.length > 0
  const entries: CashOutEntry[] = cashOuts
    .map((t) => ({
      id: t.id,
      date: t.date,
      gross: toNumber(t.grossAmount),
      feePct: toNumber(t.feePercentage),
      feeUsd: toNumber(t.feeUsd),
      net: toNumber(t.amountUsd),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalExtracted = entries.reduce((s, e) => s + e.gross, 0)
  const totalLost = entries.reduce((s, e) => s + e.feeUsd, 0)
  const avgFeePct =
    entries.length > 0
      ? entries.reduce((s, e) => s + e.feePct * e.gross, 0) / totalExtracted
      : null
  const bestPct = entries.length > 0 ? Math.min(...entries.map((e) => e.feePct)) : null
  const worstPct = entries.length > 0 ? Math.max(...entries.map((e) => e.feePct)) : null
  const hypotheticalSavings =
    entries.length > 0
      ? entries.reduce((s, e) => s + (e.gross * (e.feePct - 2)) / 100, 0)
      : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Análisis</h1>
        <p className="text-sm text-text-muted mt-1">
          ¿Compraste bien o te clavaron? Acá lo ves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hasPurchases ? (
          <AvgRateCard
            avgRate={avgRate}
            blueNow={rates.blue?.venta ?? null}
            best={best}
            worst={worst}
            totalArs={totalArs}
            totalUsd={totalUsd}
          />
        ) : (
          <AnalysisEmptyState
            Icon={TrendingUp}
            title="Compras de USD"
            description="Cada vez que registres una compra de pesos a dólares, esta página se va a llenar con métricas para que veas si compraste bien o caro."
            bullets={[
              'Tu cotización promedio ponderada por monto',
              'Comparación contra el blue del momento',
              'Cuál fue tu mejor compra y cuál la peor',
              'Total ARS gastado y USD obtenidos',
            ]}
            cta="Registrar primera compra"
            wallets={wallets}
            loans={loans}
            initialType="purchase"
          />
        )}
        <UsdSimulator />
      </div>

      {hasPurchases && (
        <PurchaseVsBlueChart blueLine={blueHistory.slice(-180)} purchases={dots} />
      )}

      {hasCashOuts ? (
        <CashOutCostPanel
          entries={entries}
          totalExtracted={totalExtracted}
          totalLost={totalLost}
          avgFeePct={avgFeePct}
          bestPct={bestPct}
          worstPct={worstPct}
          hypotheticalSavings={hypotheticalSavings}
        />
      ) : (
        <AnalysisEmptyState
          Icon={Banknote}
          title="Costo de extracciones a físico"
          description="Cuando Flor saque dólares de Wise para tenerlos como billetes, la financiera cobra una comisión. Acá vas a ver cuánto se pierde y si están negociando bien."
          bullets={[
            'Total perdido en comisiones a lo largo del tiempo',
            'Tu comisión promedio ponderada',
            'Mejor y peor comisión negociada',
            'Cuánto habrías ahorrado negociando siempre al 2%',
          ]}
          cta="Registrar primera extracción"
          wallets={wallets}
          loans={loans}
          initialType="cash_out"
        />
      )}
    </div>
  )
}
