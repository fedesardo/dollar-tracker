import { getActiveWallets } from '@/lib/queries/wallets'
import { getAllTransactionsWithLegs } from '@/lib/queries/transactions'
import { getAllLoans } from '@/lib/queries/loans'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFAB } from '@/components/transactions/TransactionFAB'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeftRight } from 'lucide-react'
import { toNumber } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const [wallets, txs, loans] = await Promise.all([
    getActiveWallets(),
    getAllTransactionsWithLegs(),
    getAllLoans(),
  ])

  // averages for prefills inside FAB
  let arsT = 0
  let usdT = 0
  let feeSum = 0
  let feeCnt = 0
  for (const t of txs) {
    if (t.type === 'purchase') {
      arsT += toNumber(t.amountArs)
      usdT += toNumber(t.amountUsd)
    } else if (t.type === 'cash_out') {
      feeSum += toNumber(t.feePercentage)
      feeCnt++
    }
  }
  const avgHistoricalRate = usdT > 0 ? arsT / usdT : null
  const avgFeePct = feeCnt > 0 ? feeSum / feeCnt : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Movimientos</h1>
          <p className="text-sm text-text-muted mt-1">
            Todo lo que pasó por los bolsillos.
          </p>
        </div>
        <TransactionFAB
          wallets={wallets}
          loans={loans}
          avgHistoricalRate={avgHistoricalRate}
          avgFeePct={avgFeePct}
        />
      </div>

      {txs.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Todavía no hay movimientos acá."
          description="Empezá registrando el primer movimiento del mes."
        />
      ) : (
        <TransactionList transactions={txs} wallets={wallets} />
      )}
    </div>
  )
}
