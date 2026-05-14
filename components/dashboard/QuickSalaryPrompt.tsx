'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PartyPopper, Calendar } from 'lucide-react'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan } from '@/lib/db/schema'
import { capitalize } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function QuickSalaryPrompt({
  wallets,
  loans,
  monthName,
  prefillAmount,
  prefillWalletId,
  isPaydayToday,
}: {
  wallets: Wallet[]
  loans: Loan[]
  monthName: string
  prefillAmount: number | null
  prefillWalletId: string | null
  isPaydayToday: boolean
}) {
  const [open, setOpen] = useState(false)

  const Icon = isPaydayToday ? PartyPopper : Calendar
  const title = isPaydayToday ? '💰 ¡Hoy cobra Flor!' : '💰 ¿Flor ya cobró?'
  const subtitle = isPaydayToday
    ? 'Dale, registralo ahora que no te olvidás.'
    : 'Dale, cargalo antes de que te olvides.'
  const ctaLabel = `Registrar sueldo de ${capitalize(monthName)} →`

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          'w-full text-left rounded-2xl border p-4 transition-colors',
          isPaydayToday
            ? 'border-accent-green/30 bg-gradient-to-r from-accent-green/15 to-accent-cyan/15 hover:border-accent-green/50'
            : 'border-accent-cyan/20 bg-gradient-to-r from-accent-cyan/10 to-accent-blue/10 hover:border-accent-cyan/40',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
              isPaydayToday
                ? 'bg-accent-green/20 text-accent-green animate-pulse'
                : 'bg-accent-cyan/15 text-accent-cyan',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
          </div>
          <span
            className={cn(
              'text-xs font-medium hidden sm:inline',
              isPaydayToday ? 'text-accent-green' : 'text-accent-cyan',
            )}
          >
            {ctaLabel}
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
