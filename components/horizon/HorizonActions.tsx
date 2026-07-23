'use client'

import { useState } from 'react'
import { CalendarSync, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HorizonContributionForm } from './HorizonContributionForm'
import { HorizonValuationForm } from './HorizonValuationForm'

export function HorizonActions() {
  const [contributionOpen, setContributionOpen] = useState(false)
  const [valuationOpen, setValuationOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setValuationOpen(true)}>
          <CalendarSync className="h-4 w-4" />
          Actualizar valores
        </Button>
        <Button variant="primary" onClick={() => setContributionOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar aporte
        </Button>
      </div>
      <HorizonContributionForm
        open={contributionOpen}
        onOpenChange={setContributionOpen}
      />
      <HorizonValuationForm open={valuationOpen} onOpenChange={setValuationOpen} />
    </>
  )
}
