'use client'

import { useState } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { Plus, Check, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Amount } from '@/components/shared/Amount'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan } from '@/lib/db/schema'
import type { LoanWithLegs } from '@/lib/queries/loans'
import { formatDateShort, formatUSD, toNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const statusMeta = {
  active: { label: 'Activo', variant: 'blue' as const },
  partially_paid: { label: 'Parcial', variant: 'yellow' as const },
  paid: { label: 'Cobrado', variant: 'green' as const },
  written_off: { label: 'Incobrable', variant: 'red' as const },
}

export function LoanCard({
  loan,
  wallets,
  loans,
}: {
  loan: LoanWithLegs
  wallets: Wallet[]
  loans: Loan[]
}) {
  const [open, setOpen] = useState(false)
  const total = toNumber(loan.totalAmount)
  const paid = toNumber(loan.amountPaid)
  const pending = total - paid
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
  const meta = statusMeta[loan.status]

  const days = differenceInDays(new Date(), new Date(loan.createdAt))
  const overdue =
    loan.dueDate && loan.status !== 'paid' && loan.status !== 'written_off'
      ? differenceInDays(new Date(), parseISO(loan.dueDate))
      : null

  const walletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? '—'

  const originBreakdown =
    loan.originLegs.length > 0
      ? loan.originLegs
          .map((l) => `${walletName(l.walletId)} USD ${formatUSD(toNumber(l.amountUsd))}`)
          .join(' + ')
      : 'Saldo inicial'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-[var(--border)] bg-bg-card p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              {loan.debtorName}
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">{originBreakdown}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {overdue !== null && overdue > 0 && (
              <Badge variant="red">🔴 Vencido {overdue}d</Badge>
            )}
            {!loan.dueDate && loan.status !== 'paid' && (
              <Badge variant="orange">⚠ Sin fecha</Badge>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mb-2">
          <Amount value={pending} size="lg" showPrefix className="text-text-primary" />
          <p className="text-xs text-text-muted text-right">
            de USD {formatUSD(total)}
            <br />
            <span className="text-[10px]">
              hace {days} {days === 1 ? 'día' : 'días'}
            </span>
          </p>
        </div>

        <Progress
          value={pct}
          indicatorColor={loan.status === 'paid' ? 'var(--green)' : 'var(--blue)'}
        />

        {loan.paymentLegs.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Cobros</p>
            {loan.paymentLegs.map((p) => {
              const sum = p.legs.reduce((s, l) => s + toNumber(l.amountUsd), 0)
              return (
                <div key={p.txId} className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <Check className="h-3 w-3 text-accent-green" />
                  <span>{formatDateShort(p.date)}</span>
                  <span className="font-mono tabular-nums text-accent-green">
                    USD {formatUSD(sum)}
                  </span>
                  <span className="text-text-muted truncate">
                    → {p.legs.map((l) => walletName(l.walletId)).join(' + ')}
                  </span>
                </div>
              )
            })}
            {pending > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                <Clock className="h-3 w-3" />
                <span>Pendiente: USD {formatUSD(pending)}</span>
              </div>
            )}
          </div>
        )}

        {(loan.status === 'active' || loan.status === 'partially_paid') && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar cobro
          </Button>
        )}

        {loan.notes && (
          <p className="mt-3 text-[11px] text-text-muted italic flex items-start gap-1.5">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{loan.notes}</span>
          </p>
        )}
      </motion.div>

      <TransactionModal
        open={open}
        onOpenChange={setOpen}
        wallets={wallets}
        loans={loans}
        initialType="loan_in"
        loanInPrefillId={loan.id}
      />
    </>
  )
}
