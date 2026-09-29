'use client'

import { useState } from 'react'
import { Check, Pencil, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  payCarLoanInstallment,
  undoCarLoanPayment,
  updateCarLoanExpected,
} from '@/actions/carLoan'
import { Badge } from '@/components/ui/badge'
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
import type { CarLoanInstallmentView } from '@/lib/utils/carLoan'
import { formatARS, formatDateShort } from '@/lib/utils/format'

const today = () => new Date().toISOString().slice(0, 10)

type Mode = { kind: 'pay' | 'expected'; row: CarLoanInstallmentView } | null

export function CarLoanInstallments({
  rows,
  asOf,
}: {
  rows: CarLoanInstallmentView[]
  asOf: string
}) {
  const [mode, setMode] = useState<Mode>(null)
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today)
  const [submitting, setSubmitting] = useState(false)

  const open = (kind: 'pay' | 'expected', row: CarLoanInstallmentView) => {
    setMode({ kind, row })
    setAmount(String(row.paidAmount ?? row.expectedTotal))
    setPaidOn(row.paidOn ?? today())
  }

  const amountNumber = Number(amount) || 0
  const creditTotal = mode?.row.creditTotal ?? 0
  const insurancePreview = amountNumber - creditTotal

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!mode) return
    if (amountNumber <= 0) return toast.error('Cargá un monto')
    setSubmitting(true)
    const result =
      mode.kind === 'pay'
        ? await payCarLoanInstallment({
            installmentId: mode.row.id,
            paidAmountArs: amountNumber,
            paidOn,
          })
        : await updateCarLoanExpected({
            installmentId: mode.row.id,
            expectedTotalArs: amountNumber,
          })
    setSubmitting(false)
    if (result.success) {
      toast.success(
        mode.kind === 'pay'
          ? `Dale. Cuota ${mode.row.number} pagada.`
          : `Cuota ${mode.row.number} actualizada.`,
      )
      setMode(null)
    } else {
      toast.error(result.error)
    }
  }

  const undo = async (row: CarLoanInstallmentView) => {
    if (!window.confirm(`¿Deshacés el pago de la cuota ${row.number}?`)) return
    const result = await undoCarLoanPayment(row.id)
    if (result.success) toast.success('Pago deshecho.')
    else toast.error(result.error)
  }

  return (
    <>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => {
          const overdue = !row.isPaid && row.dueOn < asOf
          return (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[1.1fr_1.6fr_auto] gap-3 px-4 sm:px-5 py-4 items-center"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">
                    Cuota {row.number}/{rows.length}
                  </p>
                  {row.isPaid ? (
                    <Badge variant="green">Pagada</Badge>
                  ) : overdue ? (
                    <Badge variant="red">Vencida</Badge>
                  ) : (
                    <Badge variant="muted">Pendiente</Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {row.isPaid && row.paidOn
                    ? `Pagada el ${formatDateShort(row.paidOn)}`
                    : `Vence ${formatDateShort(row.dueOn)}`}
                </p>
              </div>

              <div className="flex gap-1.5 justify-end md:order-3">
                {row.isPaid ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => open('pay', row)}
                      aria-label="Editar pago"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => undo(row)}
                      aria-label="Deshacer pago"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => open('expected', row)}
                      aria-label="Editar valor de la cuota"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => open('pay', row)}>
                      <Check className="h-3.5 w-3.5" />
                      Pagar
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 col-span-2 md:col-span-1 md:order-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {row.isPaid ? 'Pagaste' : 'Cuota'}
                  </p>
                  <p className="font-mono tabular-nums text-xs sm:text-sm mt-1">
                    {formatARS(row.paidAmount ?? row.expectedTotal, { decimals: true })}
                  </p>
                  {!row.isPaid && row.expectedTotal !== row.bankListedTotal && (
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Banco: {formatARS(row.bankListedTotal, { decimals: true })}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Crédito + IVA
                  </p>
                  <p className="font-mono tabular-nums text-xs sm:text-sm mt-1 text-text-secondary">
                    {formatARS(row.creditTotal, { decimals: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Seguro{row.isPaid ? '' : ' (est.)'}
                  </p>
                  <p className="font-mono tabular-nums text-xs sm:text-sm mt-1 text-accent-orange">
                    {formatARS(row.insurance, { decimals: true })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={mode !== null} onOpenChange={(value) => !value && setMode(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {mode?.kind === 'pay'
                ? `Pagar cuota ${mode.row.number}`
                : `Valor de la cuota ${mode?.row.number ?? ''}`}
            </DialogTitle>
            <DialogDescription>
              {mode?.kind === 'pay'
                ? 'Lo que pagaste menos el crédito (cuota fija + IVA) es el seguro del mes.'
                : 'Cargá lo que te informa el banco. El seguro estimado se recalcula solo.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="car-loan-amount">
                {mode?.kind === 'pay' ? '¿Cuánto pagaste?' : '¿Cuánto es la cuota?'}
              </Label>
              <Input
                id="car-loan-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="font-mono tabular-nums"
                required
              />
            </div>
            {mode?.kind === 'pay' && (
              <div className="space-y-1.5">
                <Label htmlFor="car-loan-paid-on">¿Cuándo?</Label>
                <Input
                  id="car-loan-paid-on"
                  type="date"
                  value={paidOn}
                  onChange={(event) => setPaidOn(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="rounded-xl border border-accent-orange/20 bg-accent-orange/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                Seguro del mes
              </p>
              <p className="font-mono tabular-nums text-xl text-accent-orange mt-1">
                {formatARS(insurancePreview, { decimals: true })}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatARS(amountNumber, { decimals: true })} −{' '}
                {formatARS(creditTotal, { decimals: true })} de crédito con IVA.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setMode(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
