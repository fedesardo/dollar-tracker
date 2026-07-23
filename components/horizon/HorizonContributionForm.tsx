'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createHorizonContribution } from '@/actions/horizon'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatARS } from '@/lib/utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export function HorizonContributionForm({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [paidOn, setPaidOn] = useState(today)
  const [creditedOn, setCreditedOn] = useState('')
  const [gross, setGross] = useState('')
  const [expenses, setExpenses] = useState('')
  const [method, setMethod] = useState<'transfer' | 'cash'>('transfer')
  const [transferFrom, setTransferFrom] = useState('Santander Fede')
  const [receipt, setReceipt] = useState('')
  const [countsForSeniority, setCountsForSeniority] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const grossNumber = Number(gross) || 0
  const expensesNumber = Number(expenses) || 0
  const housingAmount = useMemo(
    () => Math.max(0, grossNumber - expensesNumber),
    [grossNumber, expensesNumber],
  )

  const reset = () => {
    setPaidOn(today())
    setCreditedOn('')
    setGross('')
    setExpenses('')
    setMethod('transfer')
    setTransferFrom('Santander Fede')
    setReceipt('')
    setCountsForSeniority(true)
    setNotes('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (grossNumber <= 0) return toast.error('Cargá cuánto pagaste')
    if (expensesNumber < 0 || expensesNumber > grossNumber) {
      return toast.error('Los gastos no pueden superar el total')
    }

    setSubmitting(true)
    const result = await createHorizonContribution({
      paidOn,
      creditedOn: creditedOn || null,
      grossAmountArs: grossNumber,
      expensesAmountArs: expensesNumber,
      housingAmountArs: housingAmount,
      paymentMethod: method,
      transferFrom: method === 'transfer' ? transferFrom : null,
      receiptReference: receipt || null,
      countsForSeniority,
      notes: notes || null,
    })
    setSubmitting(false)

    if (result.success) {
      toast.success('Aporte guardado. Un poquito más cerca de la casita.')
      reset()
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription>
            Se registra sólo en Casita Horizonte. No toca tus dólares ni tus bolsillos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horizon-paid-on">¿Cuándo pagaste?</Label>
              <Input
                id="horizon-paid-on"
                type="date"
                value={paidOn}
                onChange={(event) => setPaidOn(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horizon-credited-on">¿Cuándo se acreditó?</Label>
              <Input
                id="horizon-credited-on"
                type="date"
                value={creditedOn}
                onChange={(event) => setCreditedOn(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horizon-gross">Total pagado</Label>
              <Input
                id="horizon-gross"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={gross}
                onChange={(event) => setGross(event.target.value)}
                className="font-mono tabular-nums"
                placeholder="700000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horizon-expenses">Gastos del período</Label>
              <Input
                id="horizon-expenses"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={expenses}
                onChange={(event) => setExpenses(event.target.value)}
                className="font-mono tabular-nums"
                placeholder="50069,87"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Se aplica a vivienda
            </p>
            <p className="font-mono tabular-nums text-xl text-accent-green mt-1">
              {formatARS(housingAmount, { decimals: true })}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Es el total menos los gastos. Este importe es el que compra porcentaje.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>¿Cómo pagaste?</Label>
              <Select
                value={method}
                onValueChange={(value: 'transfer' | 'cash') => setMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {method === 'transfer' && (
              <div className="space-y-1.5">
                <Label htmlFor="horizon-transfer-from">¿Desde dónde?</Label>
                <Input
                  id="horizon-transfer-from"
                  value={transferFrom}
                  onChange={(event) => setTransferFrom(event.target.value)}
                  placeholder="Santander Fede"
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="horizon-receipt">Recibo o referencia</Label>
            <Input
              id="horizon-receipt"
              value={receipt}
              onChange={(event) => setReceipt(event.target.value)}
              placeholder="Opcional"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-bg-elevated p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={countsForSeniority}
              onChange={(event) => setCountsForSeniority(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--green)]"
            />
            <span>
              <span className="block text-sm text-text-primary">
                Este mes suma antigüedad
              </span>
              <span className="block text-xs text-text-muted mt-0.5">
                Marcado cuando el aporte cubre los gastos obligatorios del mes.
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="horizon-notes">Notas</Label>
            <Textarea
              id="horizon-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Algo que quieras recordar de este aporte…"
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
              {submitting ? 'Guardando…' : 'Guardar aporte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
