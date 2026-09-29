'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { setCarLoanInsuranceFrom } from '@/actions/carLoan'
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

export function CarLoanActions({ nextNumber }: { nextNumber: number }) {
  const [open, setOpen] = useState(false)
  const [fromNumber, setFromNumber] = useState(String(Math.max(nextNumber, 3)))
  const [insurance, setInsurance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await setCarLoanInsuranceFrom({
      fromNumber: Number(fromNumber),
      insuranceArs: Number(insurance),
    })
    setSubmitting(false)
    if (result.success) {
      toast.success('Listo. Seguro actualizado en las cuotas pendientes.')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ShieldCheck className="h-4 w-4" />
        Cambiar seguro
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Cambiar seguro</DialogTitle>
            <DialogDescription>
              Pisa el seguro estimado de todas las cuotas sin pagar desde la que
              elijas. Las ya pagadas no se tocan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="insurance-from">¿Desde qué cuota?</Label>
              <Input
                id="insurance-from"
                type="number"
                min="1"
                max="18"
                value={fromNumber}
                onChange={(event) => setFromNumber(event.target.value)}
                className="font-mono tabular-nums"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurance-amount">¿Cuánto es el seguro por mes?</Label>
              <Input
                id="insurance-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={insurance}
                onChange={(event) => setInsurance(event.target.value)}
                className="font-mono tabular-nums"
                placeholder="30000"
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? 'Guardando…' : 'Aplicar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
