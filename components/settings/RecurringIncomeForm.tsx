'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRecurringIncome, updateRecurringIncome } from '@/actions/recurringIncomes'
import type { Wallet, Owner, RecurringIncome } from '@/lib/db/schema'
import { toNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const OWNERS: { value: Owner; label: string }[] = [
  { value: 'flor', label: 'Flor' },
  { value: 'fede', label: 'Fede' },
]

export function RecurringIncomeForm({
  open,
  onOpenChange,
  wallets,
  rule,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  wallets: Wallet[]
  rule?: RecurringIncome
}) {
  const isEdit = !!rule
  const virtualWallets = wallets.filter((w) => w.isActive && w.type === 'virtual')

  const [description, setDescription] = useState(rule?.description ?? 'Sueldo Flor')
  const [beneficiary, setBeneficiary] = useState<Owner>(rule?.beneficiary ?? 'flor')
  const [walletId, setWalletId] = useState<string>(rule?.walletId ?? virtualWallets[0]?.id ?? '')
  const [amountUsd, setAmountUsd] = useState<string>(
    rule ? String(toNumber(rule.amountUsd)) : '2200',
  )
  const [dayOfMonth, setDayOfMonth] = useState<string>(String(rule?.dayOfMonth ?? 21))
  const [isActive, setIsActive] = useState<boolean>(rule?.isActive ?? true)
  const [notes, setNotes] = useState(rule?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const usd = parseFloat(amountUsd)
    if (!usd || usd <= 0) return toast.error('Cargá un monto válido')
    const day = parseInt(dayOfMonth, 10)
    if (!day || day < 1 || day > 31) return toast.error('El día tiene que estar entre 1 y 31')
    if (!walletId) return toast.error('Elegí un bolsillo')
    if (!description.trim()) return toast.error('Poné una descripción')

    setSubmitting(true)
    const payload = {
      description: description.trim(),
      beneficiary,
      walletId,
      amountUsd: usd,
      dayOfMonth: day,
      isActive,
      notes: notes || null,
    }
    const res = isEdit
      ? await updateRecurringIncome(rule.id, payload)
      : await createRecurringIncome(payload)
    setSubmitting(false)
    if (res.success) {
      toast.success(isEdit ? 'Regla actualizada.' : '¡Listo! Se va a registrar automático cada mes.')
      onOpenChange(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar ingreso automático' : 'Nuevo ingreso automático'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Descripción">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sueldo Flor"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="¿De quién?">
              <div className="flex gap-1 rounded-xl bg-bg-elevated p-1">
                {OWNERS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setBeneficiary(o.value)}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-sm transition-colors',
                      beneficiary === o.value
                        ? 'bg-bg-card text-text-primary shadow'
                        : 'text-text-muted',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Día del mes">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                required
                className="font-mono tabular-nums"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Si el mes tiene menos días, se registra el último día disponible.
              </p>
            </Field>
          </div>

          <Field label="Monto USD">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="2200.00"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              required
              className="font-mono tabular-nums text-lg"
            />
          </Field>

          <Field label="¿A qué bolsillo?">
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí" />
              </SelectTrigger>
              <SelectContent>
                {virtualWallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: w.color }} />
                      {w.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Estado">
            <div className="flex gap-1 rounded-xl bg-bg-elevated p-1">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent-green/15 text-accent-green shadow'
                    : 'text-text-muted',
                )}
              >
                Activa
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm transition-colors',
                  !isActive
                    ? 'bg-bg-card text-text-primary shadow'
                    : 'text-text-muted',
                )}
              >
                Pausada
              </button>
            </div>
          </Field>

          <Field label="Notas">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opcional"
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear regla'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
