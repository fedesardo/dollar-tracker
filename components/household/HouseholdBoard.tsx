'use client'

import { useMemo, useState } from 'react'
import { Link2, Pencil, Plus, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
  archiveHouseholdItem,
  createHouseholdItem,
  saveHouseholdItem,
} from '@/actions/household'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { HouseholdItemView } from '@/lib/queries/household'
import {
  FREQUENCY_OPTIONS,
  HOUSEHOLD_GROUPS,
  calculateStructure,
  monthlyEquivalent,
  roundToThousand,
  toArs,
} from '@/lib/utils/household'
import { formatARS, formatMonthYear } from '@/lib/utils/format'

const money = (value: number, currency: 'ARS' | 'USD') =>
  currency === 'USD'
    ? `US$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : formatARS(value)

const monthLabel = (month: string) => {
  const [year, m] = month.split('-').map(Number)
  return formatMonthYear(year, m)
}

export function HouseholdBoard({
  items,
  usdRate,
  month,
}: {
  items: HouseholdItemView[]
  usdRate: number
  month: string
}) {
  // Simulación: id → nuevo monto de cada cobro (0 = darse de baja). No se guarda.
  const [simulated, setSimulated] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<HouseholdItemView | null>(null)
  const [creating, setCreating] = useState(false)

  const inputs = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        currency: item.currency,
        monthsPerCharge: item.monthsPerCharge,
        amount: item.amount,
      })),
    [items],
  )
  const base = calculateStructure(inputs, usdRate)
  const sim = calculateStructure(inputs, usdRate, simulated)
  const saving = base.totalArs - sim.totalArs
  const simulating = Object.keys(simulated).length > 0

  const toggleSimulate = (item: HouseholdItemView) =>
    setSimulated((prev) => {
      const next = { ...prev }
      if (item.id in next) delete next[item.id]
      else next[item.id] = 0
      return next
    })

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-accent-purple/20 bg-bg-card p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-purple/10 blur-3xl" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-text-secondary">
              Lo que necesita la casa por mes
              <InfoTooltip
                size="xs"
                text="Suma aproximada de todos los conceptos. Lo que se paga cada varios meses se reparte por mes, y lo que está en dólares se pasa al blue de hoy. Es un número orientativo, no una cuenta al centavo."
              />
            </p>
            <p className="mt-4 font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
              ≈ {formatARS(roundToThousand(base.totalArs))}
            </p>
            <p className="mt-2 font-mono text-sm tabular-nums text-text-muted">
              ≈ US$ {Math.round(base.totalUsd).toLocaleString('es-AR')} al blue de hoy ($
              {Math.round(usdRate).toLocaleString('es-AR')})
            </p>
            {base.missing > 0 && (
              <p className="mt-3 text-xs text-accent-yellow">
                Falta cargar el monto de {base.missing}{' '}
                {base.missing === 1 ? 'concepto' : 'conceptos'}: el número real es más alto.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-5">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
              <SlidersHorizontal className="h-3 w-3" />
              Si nos damos de baja
            </p>
            {simulating ? (
              <>
                <p className="mt-2 font-mono text-2xl tabular-nums text-accent-green">
                  −{formatARS(roundToThousand(saving))}
                </p>
                <p className="mt-1 font-mono text-xs tabular-nums text-text-muted">
                  por mes · quedaría ≈ {formatARS(roundToThousand(sim.totalArs))}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSimulated({})}
                >
                  Limpiar simulación
                </Button>
              </>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">
                Tocá “Simular” en cualquier concepto para ver cuánto se ahorra. No cambia
                nada, es solo para probar.
              </p>
            )}
          </div>
        </div>
      </section>

      {HOUSEHOLD_GROUPS.map((group) => {
        const rows = items.filter((item) => item.groupKey === group.id)
        if (rows.length === 0) return null
        const groupTotal = rows.reduce(
          (sum, item) =>
            sum +
            (item.amount === null
              ? 0
              : toArs(monthlyEquivalent(item.amount, item.monthsPerCharge), item.currency, usdRate)),
          0,
        )
        return (
          <Card key={group.id}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
              <p className="font-display text-base font-semibold">{group.label}</p>
              <p className="font-mono text-sm tabular-nums text-text-secondary">
                ≈ {formatARS(roundToThousand(groupTotal))} / mes
              </p>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--border)]">
                {rows.map((item) => {
                  const simValue = simulated[item.id]
                  const isSim = item.id in simulated
                  const perMonth =
                    item.amount === null
                      ? null
                      : toArs(
                          monthlyEquivalent(item.amount, item.monthsPerCharge),
                          item.currency,
                          usdRate,
                        )
                  const showPerMonth = item.currency === 'USD' || item.monthsPerCharge > 1
                  return (
                    <div key={item.id} className="px-4 py-3.5 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-medium ${isSim ? 'text-text-muted line-through' : ''}`}>
                              {item.name}
                            </p>
                            {item.linked && (
                              <Badge variant="blue">
                                <Link2 className="h-2.5 w-2.5" />
                                Préstamo BYD
                              </Badge>
                            )}
                            {item.monthsPerCharge > 1 && (
                              <Badge variant="muted">
                                {FREQUENCY_OPTIONS.find((o) => o.months === item.monthsPerCharge)
                                  ?.label ?? `Cada ${item.monthsPerCharge} meses`}
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-0.5 text-[11px] text-text-muted">{item.notes}</p>
                          )}
                          {item.effectiveFrom && (
                            <p className="mt-0.5 text-[11px] text-text-muted">
                              Vigente desde {monthLabel(item.effectiveFrom.slice(0, 7))}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 items-start gap-2">
                          <div className="text-right">
                            {item.amount === null ? (
                              <Badge variant="yellow">Falta cargar</Badge>
                            ) : (
                              <>
                                <p
                                  className={`font-mono text-sm tabular-nums ${isSim ? 'text-text-muted line-through' : ''}`}
                                >
                                  {money(item.amount, item.currency)}
                                </p>
                                {showPerMonth && perMonth !== null && (
                                  <p className="font-mono text-[11px] tabular-nums text-text-muted">
                                    ≈ {formatARS(roundToThousand(perMonth))} / mes
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          {!item.linked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(item)}
                              aria-label={`Actualizar ${item.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {item.amount !== null && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button
                            variant={isSim ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => toggleSimulate(item)}
                          >
                            {isSim ? 'Dejar de simular' : 'Simular baja'}
                          </Button>
                          {isSim && (
                            <label className="flex items-center gap-2 text-xs text-text-muted">
                              o pasaría a costar
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={simValue === 0 ? '' : String(simValue)}
                                onChange={(event) =>
                                  setSimulated((prev) => ({
                                    ...prev,
                                    [item.id]: Number(event.target.value) || 0,
                                  }))
                                }
                                placeholder="0"
                                className="h-8 w-28 font-mono tabular-nums"
                                aria-label={`Nuevo monto de ${item.name}`}
                              />
                              {item.currency === 'USD' ? 'US$' : '$'}
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div>
        <Button variant="secondary" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Agregar concepto
        </Button>
      </div>

      <EditDialog item={editing} month={month} onClose={() => setEditing(null)} />
      <CreateDialog open={creating} month={month} onClose={() => setCreating(false)} />
    </>
  )
}

function EditDialog({
  item,
  month,
  onClose,
}: {
  item: HouseholdItemView | null
  month: string
  onClose: () => void
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        {item && <EditBody key={item.id} item={item} month={month} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function EditBody({
  item,
  month,
  onClose,
}: {
  item: HouseholdItemView
  month: string
  onClose: () => void
}) {
  const [amount, setAmount] = useState(item.amount === null ? '' : String(item.amount))
  const [from, setFrom] = useState(month)
  const [months, setMonths] = useState(String(item.monthsPerCharge))
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await saveHouseholdItem({
      itemId: item.id,
      month: from,
      amount: amount === '' ? null : Number(amount),
      monthsPerCharge: Number(months),
    })
    setSubmitting(false)
    if (result.success) {
      toast.success(`Dale. ${item.name} actualizado.`)
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  const archive = async () => {
    if (!window.confirm(`¿Sacás ${item.name} de la estructura? Queda guardado el historial.`)) return
    const result = await archiveHouseholdItem(item.id)
    if (result.success) {
      toast.success('Listo. Ya no cuenta en el número.')
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item.name}</DialogTitle>
        <DialogDescription>
          El monto nuevo rige desde el mes que elijas y hasta que cargues otro. Los meses
          anteriores no cambian.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="hh-amount">
            ¿Cuánto es ahora? ({item.currency === 'USD' ? 'US$' : '$'})
          </Label>
          <Input
            id="hh-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="font-mono tabular-nums"
            placeholder="Aproximado está bien"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hh-from">¿Desde qué mes?</Label>
            <Input
              id="hh-from"
              type="month"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>¿Cada cuánto se paga?</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.months} value={String(option.months)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {item.history.length > 1 && (
          <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/40 p-3">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-text-muted">
              Historial
            </p>
            {item.history.slice(0, 5).map((point) => (
              <p
                key={point.effectiveFrom}
                className="flex justify-between font-mono text-xs tabular-nums text-text-secondary"
              >
                <span>{monthLabel(point.effectiveFrom.slice(0, 7))}</span>
                <span>{money(point.amount, item.currency)}</span>
              </p>
            ))}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" className="flex-1" onClick={archive}>
            Sacar de la lista
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </>
  )
}

function CreateDialog({
  open,
  month,
  onClose,
}: {
  open: boolean
  month: string
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        {open && <CreateBody month={month} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateBody({ month, onClose }: { month: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('otros')
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
  const [months, setMonths] = useState('1')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await createHouseholdItem({
      name,
      groupKey: group as 'casa' | 'auto' | 'plataformas' | 'clubes' | 'otros',
      currency,
      monthsPerCharge: Number(months),
      month,
      amount: amount === '' ? null : Number(amount),
    })
    setSubmitting(false)
    if (result.success) {
      toast.success('Dale. Concepto agregado.')
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar concepto</DialogTitle>
        <DialogDescription>Algo fijo que se suma a lo que necesita la casa.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="hh-new-name">¿Qué es?</Label>
          <Input
            id="hh-new-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Seguro de hogar"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>¿En qué grupo?</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUSEHOLD_GROUPS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>¿En qué moneda?</Label>
            <Select value={currency} onValueChange={(v: 'ARS' | 'USD') => setCurrency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos</SelectItem>
                <SelectItem value="USD">Dólares</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hh-new-amount">¿Cuánto es?</Label>
            <Input
              id="hh-new-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="font-mono tabular-nums"
              placeholder="Podés dejarlo vacío"
            />
          </div>
          <div className="space-y-1.5">
            <Label>¿Cada cuánto se paga?</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.months} value={String(option.months)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Agregar'}
          </Button>
        </div>
      </form>
    </>
  )
}
