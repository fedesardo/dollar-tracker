'use client'

import { useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ArrowLeftRight,
  Banknote,
  Handshake,
  CheckCircle,
} from 'lucide-react'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan, TransactionType } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

const actions: { type: TransactionType; label: string; Icon: React.ComponentType<{ className?: string }>; emoji: string }[] = [
  { type: 'income', label: 'Sueldo', Icon: ArrowDownCircle, emoji: '💰' },
  { type: 'purchase', label: 'Compra USD', Icon: TrendingUp, emoji: '🔄' },
  { type: 'expense', label: 'Egreso', Icon: ArrowUpCircle, emoji: '📤' },
  { type: 'transfer', label: 'Transferir', Icon: ArrowLeftRight, emoji: '↔' },
  { type: 'cash_out', label: 'Extracción', Icon: Banknote, emoji: '💵' },
  { type: 'loan_out', label: 'Préstamo', Icon: Handshake, emoji: '🤝' },
  { type: 'loan_in', label: 'Cobro', Icon: CheckCircle, emoji: '✅' },
]

export function QuickActions({
  wallets,
  loans,
  avgHistoricalRate,
  avgFeePct,
}: {
  wallets: Wallet[]
  loans: Loan[]
  avgHistoricalRate: number | null
  avgFeePct: number | null
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType | null>(null)

  const fire = (t: TransactionType) => {
    setType(t)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-text-muted">Atajos</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {actions.map((a) => (
            <button
              key={a.type}
              type="button"
              onClick={() => fire(a.type)}
              className={cn(
                'flex-shrink-0 snap-start inline-flex items-center gap-2 rounded-full',
                'border border-[var(--border)] bg-bg-elevated px-3 py-2 text-xs',
                'hover:border-[var(--border-hover)] hover:bg-bg-elevated/80 transition-colors',
              )}
            >
              <span className="text-sm">{a.emoji}</span>
              <span className="text-text-primary font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <TransactionModal
        open={open}
        onOpenChange={setOpen}
        wallets={wallets}
        loans={loans}
        initialType={type}
        avgHistoricalRate={avgHistoricalRate}
        avgFeePct={avgFeePct}
      />
    </>
  )
}
