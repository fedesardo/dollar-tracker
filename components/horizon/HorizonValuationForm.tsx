'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createHorizonValuation } from '@/actions/horizon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const today = () => new Date().toISOString().slice(0, 10)

export function HorizonValuationForm({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [effectiveOn, setEffectiveOn] = useState(today)
  const [official, setOfficial] = useState('')
  const [target, setTarget] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const officialAmountArs = Number(official)
    const targetAmountArs = Number(target)
    if (officialAmountArs <= 0 || targetAmountArs <= 0) {
      return toast.error('Cargá los dos valores de vivienda')
    }

    setSubmitting(true)
    const result = await createHorizonValuation({
      effectiveOn,
      officialAmountArs,
      targetAmountArs,
      notes: notes || null,
    })
    setSubmitting(false)

    if (result.success) {
      toast.success('Valores actualizados. Los porcentajes ya se recalcularon.')
      setEffectiveOn(today())
      setOfficial('')
      setTarget('')
      setNotes('')
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Actualizar valores</DialogTitle>
          <DialogDescription>
            Cargá los precios de la lista vigente. El porcentaje comprado no cambia:
            cambia su valor actualizado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="horizon-value-date">Vigente desde</Label>
            <Input
              id="horizon-value-date"
              type="date"
              value={effectiveOn}
              onChange={(event) => setEffectiveOn(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="horizon-official-value">Valor D30/0/D</Label>
            <Input
              id="horizon-official-value"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={official}
              onChange={(event) => setOfficial(event.target.value)}
              className="font-mono tabular-nums"
              placeholder="57503033,77"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="horizon-target-value">Valor B68/0/L — 250 m²</Label>
            <Input
              id="horizon-target-value"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="font-mono tabular-nums"
              placeholder="113484848,03"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="horizon-value-notes">Fuente o notas</Label>
            <Textarea
              id="horizon-value-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Estado 532, lista enviada por la asesora…"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Actualizando…' : 'Guardar valores'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
