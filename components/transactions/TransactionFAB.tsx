'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TransactionModal } from './TransactionModal'
import { transactionMeta } from '@/components/shared/TransactionBadge'
import type { Wallet, Loan, TransactionType } from '@/lib/db/schema'

const ORDER: TransactionType[] = [
  'income',
  'purchase',
  'expense',
  'transfer',
  'cash_out',
  'loan_out',
  'loan_in',
]

export function TransactionFAB({
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
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType | null>(null)

  const fire = (t: TransactionType) => {
    setExpanded(false)
    setType(t)
    setOpen(true)
  }

  return (
    <>
      <div className="hidden lg:block">
        <Button onClick={() => setOpen(true)} variant="primary" size="default">
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </div>

      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 flex flex-col items-end gap-2"
            >
              {ORDER.map((t, i) => {
                const meta = transactionMeta(t)
                const Icon = meta.Icon
                return (
                  <motion.button
                    key={t}
                    onClick={() => fire(t)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-2 rounded-full bg-bg-elevated border border-[var(--border)] px-3 py-2 shadow-xl bg-accent-${meta.variant}/10`}
                  >
                    <Icon className={`h-4 w-4 text-accent-${meta.variant}`} />
                    <span className="text-xs text-text-primary font-medium">{meta.label}</span>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="primary"
          size="icon"
          className="h-14 w-14 shadow-2xl shadow-accent-green/20"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </Button>
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
