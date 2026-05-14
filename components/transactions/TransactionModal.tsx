'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionBadge, transactionMeta } from '@/components/shared/TransactionBadge'
import { IncomeForm, type IncomePrefill } from './forms/IncomeForm'
import { ExpenseForm } from './forms/ExpenseForm'
import { PurchaseForm } from './forms/PurchaseForm'
import { TransferForm } from './forms/TransferForm'
import { CashOutForm } from './forms/CashOutForm'
import { LoanOutForm } from './forms/LoanOutForm'
import { LoanInForm } from './forms/LoanInForm'
import type { Wallet, Loan, TransactionType } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

const types: { type: TransactionType; label: string }[] = [
  { type: 'income', label: 'Sueldo' },
  { type: 'purchase', label: 'Compra USD' },
  { type: 'expense', label: 'Egreso' },
  { type: 'transfer', label: 'Transferencia' },
  { type: 'cash_out', label: 'Extracción a físico' },
  { type: 'loan_out', label: 'Préstamo otorgado' },
  { type: 'loan_in', label: 'Cobro de préstamo' },
]

export function TransactionModal({
  open,
  onOpenChange,
  wallets,
  loans,
  initialType,
  incomePrefill,
  loanInPrefillId,
  avgHistoricalRate,
  avgFeePct,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  wallets: Wallet[]
  loans: Loan[]
  initialType?: TransactionType | null
  incomePrefill?: IncomePrefill
  loanInPrefillId?: string
  avgHistoricalRate?: number | null
  avgFeePct?: number | null
}) {
  const [selected, setSelected] = useState<TransactionType | null>(initialType ?? null)

  useEffect(() => {
    if (open) setSelected(initialType ?? null)
  }, [open, initialType])

  const close = () => {
    onOpenChange(false)
    setTimeout(() => setSelected(null), 200)
  }

  const meta = selected ? transactionMeta(selected) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader
          className={cn(
            'transition-colors duration-200 -mx-5 sm:-mx-6 -mt-2 sm:-mt-2 px-5 sm:px-6 pt-2 sm:pt-2 pb-3 border-b border-[var(--border)]',
            meta && `bg-accent-${meta.variant}/5`,
          )}
        >
          <DialogTitle>
            {selected ? (
              <span className="flex items-center gap-2">
                <TransactionBadge type={selected} />
                <span className="font-display">Nueva</span>
              </span>
            ) : (
              <span className="font-display">¿Qué movimiento querés registrar?</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-2 pt-2"
            >
              {types.map(({ type, label }) => {
                const tm = transactionMeta(type)
                const Icon = tm.Icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelected(type)}
                    className={cn(
                      'group rounded-2xl border border-[var(--border)] p-4 text-left transition-all hover:border-[var(--border-hover)]',
                      `hover:bg-accent-${tm.variant}/5`,
                    )}
                  >
                    <div
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-full mb-2',
                        `bg-accent-${tm.variant}/10 text-accent-${tm.variant}`,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-text-primary">{label}</div>
                    <div className="text-[11px] text-text-muted">{descFor(type)}</div>
                  </button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key={selected}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-1"
            >
              {selected === 'income' && (
                <IncomeForm wallets={wallets} prefill={incomePrefill} onDone={close} />
              )}
              {selected === 'expense' && <ExpenseForm wallets={wallets} onDone={close} />}
              {selected === 'purchase' && (
                <PurchaseForm
                  wallets={wallets}
                  avgHistoricalRate={avgHistoricalRate ?? null}
                  onDone={close}
                />
              )}
              {selected === 'transfer' && <TransferForm wallets={wallets} onDone={close} />}
              {selected === 'cash_out' && (
                <CashOutForm wallets={wallets} avgFeePct={avgFeePct ?? null} onDone={close} />
              )}
              {selected === 'loan_out' && <LoanOutForm wallets={wallets} onDone={close} />}
              {selected === 'loan_in' && (
                <LoanInForm
                  wallets={wallets}
                  loans={loans}
                  prefillLoanId={loanInPrefillId}
                  onDone={close}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

function descFor(t: TransactionType): string {
  switch (t) {
    case 'income':
      return 'Cobraron en USD'
    case 'expense':
      return 'Pagaron algo en USD'
    case 'purchase':
      return 'Cambiaron pesos por dólares'
    case 'transfer':
      return 'Movieron entre bolsillos'
    case 'cash_out':
      return 'Wise → billetes con fee'
    case 'loan_out':
      return 'Prestaron plata'
    case 'loan_in':
      return 'Les pagaron un préstamo'
  }
}
