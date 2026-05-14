'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { Wallet, Loan } from '@/lib/db/schema'

export function LoansHeaderActions({
  wallets,
  loans,
}: {
  wallets: Wallet[]
  loans: Loan[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Nuevo préstamo
      </Button>

      <TransactionModal
        open={open}
        onOpenChange={setOpen}
        wallets={wallets}
        loans={loans}
        initialType="loan_out"
      />
    </>
  )
}
