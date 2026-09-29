'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CoverageMap } from '@/lib/utils/carInsurance'
import { InsuranceOfferForm } from './InsuranceOfferForm'

export function InsuranceActions({ currentCoverages }: { currentCoverages: CoverageMap }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Cargar oferta
      </Button>
      <InsuranceOfferForm
        open={open}
        onOpenChange={setOpen}
        currentCoverages={currentCoverages}
      />
    </>
  )
}
