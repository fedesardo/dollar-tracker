'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan } from '@/lib/db/schema'
import { capitalize } from '@/lib/utils/format'

export function QuickSalaryPrompt({
  wallets,
  loans,
  monthName,
  prefillAmount,
  prefillWalletId,
}: {
  wallets: Wallet[]
  loans: Loan[]
  monthName: string
  prefillAmount: number | null
  prefillWalletId: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full text-left rounded-2xl border border-accent-cyan/20 bg-gradient-to-r from-accent-cyan/10 to-accent-blue/10 p-4 hover:border-accent-cyan/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-cyan/15 text-accent-cyan flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              💰 ¿Flor ya cobró?
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Dale, cargalo antes de que te olvides.
            </p>
          </div>
          <span className="text-xs text-accent-cyan font-medium hidden sm:inline">
            Registrar sueldo de {capitalize(monthName)} →
          </span>
        </div>
      </motion.button>

      <TransactionModal
        open={open}
        onOpenChange={setOpen}
        wallets={wallets}
        loans={loans}
        initialType="income"
        incomePrefill={{
          beneficiary: 'flor',
          amountUsd: prefillAmount ?? 2200,
          walletId: prefillWalletId ?? undefined,
        }}
      />
    </>
  )
}
