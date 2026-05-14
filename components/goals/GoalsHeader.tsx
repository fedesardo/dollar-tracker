'use client'

import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoalForm } from './GoalForm'
import { EmptyState } from '@/components/shared/EmptyState'

export function GoalsActions({ empty }: { empty: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Metas</h1>
          <p className="text-sm text-text-muted mt-1">¿Para qué están ahorrando?</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva meta
        </Button>
      </div>

      {empty && (
        <EmptyState
          icon={Target}
          title="Sin metas todavía"
          description="¿Para qué están ahorrando? Cargalo acá y la app te dice cuándo llegan."
          action={
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Crear primera meta
            </Button>
          }
        />
      )}

      <GoalForm open={open} onOpenChange={setOpen} />
    </>
  )
}
