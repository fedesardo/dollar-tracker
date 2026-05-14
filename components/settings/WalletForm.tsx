'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWallet, updateWallet } from '@/actions/wallets'
import type { Wallet, WalletType, Owner } from '@/lib/db/schema'
import { toNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const COLORS = [
  '#60a5fa',
  '#fbbf24',
  '#34d399',
  '#a78bfa',
  '#f87171',
  '#fb923c',
  '#22d3ee',
  '#ec4899',
]

const ICONS = [
  { value: 'credit-card', label: '💳 Card' },
  { value: 'landmark', label: '🏛 Banco' },
  { value: 'banknote', label: '💵 Billete' },
  { value: 'wallet', label: '👛 Wallet' },
  { value: 'piggy-bank', label: '🐷 Chancho' },
  { value: 'coins', label: '🪙 Monedas' },
  { value: 'clock', label: '⏰ Pendiente' },
]

const TYPES: { value: WalletType; label: string; hint: string }[] = [
  { value: 'virtual', label: 'Virtual', hint: 'Cuentas digitales (Wise, Brubank, Naranja)' },
  { value: 'physical', label: 'Físico', hint: 'Billetes en mano' },
  { value: 'receivable', label: 'Pendiente', hint: '⚠ deprecated — usá préstamos' },
]

const OWNERS: { value: Owner; label: string }[] = [
  { value: 'flor', label: 'Flor' },
  { value: 'fede', label: 'Fede' },
  { value: 'joint', label: 'Ambos' },
]

export function WalletForm({
  open,
  onOpenChange,
  wallet,
  defaultSortOrder,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  wallet?: Wallet
  defaultSortOrder?: number
}) {
  const isEdit = !!wallet
  const [name, setName] = useState(wallet?.name ?? '')
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'virtual')
  const [owner, setOwner] = useState<Owner>(wallet?.owner ?? 'fede')
  const [initialBalance, setInitialBalance] = useState<string>(
    wallet ? String(toNumber(wallet.initialBalance)) : '0',
  )
  const [color, setColor] = useState(wallet?.color ?? COLORS[0])
  const [icon, setIcon] = useState(wallet?.icon ?? 'wallet')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Cargá un nombre')
    const balance = parseFloat(initialBalance) || 0
    if (balance < 0) return toast.error('El saldo inicial no puede ser negativo')

    setSubmitting(true)
    const payload = {
      name,
      type,
      owner,
      initialBalance: balance,
      color,
      icon,
      sortOrder: wallet?.sortOrder ?? defaultSortOrder ?? 0,
    }
    const res = isEdit
      ? await updateWallet(wallet.id, payload)
      : await createWallet(payload)
    setSubmitting(false)
    if (res.success) {
      toast.success(isEdit ? 'Bolsillo actualizado.' : 'Bolsillo creado.')
      onOpenChange(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar ${wallet.name}` : 'Nuevo bolsillo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nombre">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Brubank Fede"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={type} onValueChange={(v) => setType(v as WalletType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex flex-col items-start">
                        <span>{t.label}</span>
                        <span className="text-[10px] text-text-muted">{t.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="¿De quién?">
              <Select value={owner} onValueChange={(v) => setOwner(v as Owner)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OWNERS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Saldo inicial (USD)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
              className="font-mono tabular-nums text-lg"
            />
            <p className="text-[11px] text-text-muted mt-1">
              {isEdit
                ? '⚠ Cambiar este valor afecta el saldo actual del bolsillo. Las transacciones quedan intactas.'
                : 'El saldo en USD que tiene este bolsillo HOY antes de cualquier movimiento.'}
            </p>
          </Field>

          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-9 w-9 rounded-lg border-2 transition-transform',
                    color === c ? 'border-text-primary scale-110' : 'border-transparent',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>

          <Field label="Icono">
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear bolsillo'}
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
