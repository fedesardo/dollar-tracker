'use client'

import { useState } from 'react'
import { TrendingUp, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan, TransactionType } from '@/lib/db/schema'

export function AnalysisEmptyState({
  Icon,
  title,
  description,
  bullets,
  cta,
  wallets,
  loans,
  initialType,
  avgHistoricalRate,
  avgFeePct,
}: {
  Icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  cta: string
  wallets: Wallet[]
  loans: Loan[]
  initialType: TransactionType
  avgHistoricalRate?: number | null
  avgFeePct?: number | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-bg-card/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl bg-bg-elevated p-3">
            <Icon className="h-5 w-5 text-text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-semibold text-text-primary">
              {title}
            </h3>
            <p className="text-xs text-text-secondary mt-1">{description}</p>
            <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent-cyan mt-0.5">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {cta}
            </Button>
          </div>
        </div>
      </div>

      <TransactionModal
        open={open}
        onOpenChange={setOpen}
        wallets={wallets}
        loans={loans}
        initialType={initialType}
        avgHistoricalRate={avgHistoricalRate}
        avgFeePct={avgFeePct}
      />
    </>
  )
}
