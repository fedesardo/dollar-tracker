'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Link2, Plus } from 'lucide-react'
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
  addMonths,
  currentAmount,
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

const shortMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1).toLocaleDateString('es-AR', {
    month: 'short',
    year: '2-digit',
  })
}

const WINDOW = 6

type Cell = { value: number | null; explicit: boolean }

function cellAt(item: HouseholdItemView, month: string): Cell {
  if (item.linkedByMonth) return { value: item.linkedByMonth[month] ?? null, explicit: true }
  const point = currentAmount(item.history, month)
  return {
    value: point?.amount ?? null,
    explicit: item.history.some((p) => p.effectiveFrom.slice(0, 7) === month),
  }
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
  const [offset, setOffset] = useState(0)
  const [simulated, setSimulated] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<HouseholdItemView | null>(null)
  const [creating, setCreating] = useState(false)

  const months = useMemo(
    () => Array.from({ length: WINDOW }, (_, i) => addMonths(month, offset - 3 + i)),
    [month, offset],
  )

  const perMonthArs = (item: HouseholdItemView, m: string) => {
    const { value } = cellAt(item, m)
    return value === null
      ? 0
      : toArs(monthlyEquivalent(value, item.monthsPerCharge), item.currency, usdRate)
  }
  const sumFor = (list: HouseholdItemView[], m: string) =>
    list.reduce((sum, item) => sum + perMonthArs(item, m), 0)
  const missingFor = (m: string) =>
    items.filter((item) => cellAt(item, m).value === null).length

  const nowTotal = sumFor(items, month)
  const nowMissing = missingFor(month)
  const saving = sumFor(
    items.filter((item) => simulated.has(item.id)),
    month,
  )

  const toggleSimulate = (id: string) =>
    setSimulated((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <Card>
        <CardContent className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[1.2fr_0.8fr] sm:p-6">
          <div>
            <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-text-secondary">
              Lo que necesita la casa en {monthLabel(month)}
              <InfoTooltip
                size="xs"
                text="Suma aproximada de la columna del mes. Lo que se paga cada varios meses se reparte por mes y lo que está en dólares se pasa al blue de hoy. Es un número orientativo, no una cuenta al centavo."
              />
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
              ≈ {formatARS(roundToThousand(nowTotal))}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-text-muted">
              ≈ US$ {Math.round(nowTotal / usdRate).toLocaleString('es-AR')} al blue de hoy ($
              {Math.round(usdRate).toLocaleString('es-AR')})
            </p>
            {nowMissing > 0 && (
              <p className="mt-2 text-xs text-accent-yellow">
                Faltan {nowMissing} {nowMissing === 1 ? 'monto' : 'montos'} este mes (las
                celdas con guion): el número real es más alto.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Si damos de baja lo tildado
            </p>
            {simulated.size > 0 ? (
              <>
                <p className="mt-1 font-mono text-xl tabular-nums text-accent-green">
                  −{formatARS(roundToThousand(saving))} / mes
                </p>
                <p className="font-mono text-xs tabular-nums text-text-muted">
                  quedaría ≈ {formatARS(roundToThousand(nowTotal - saving))}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSimulated(new Set())}
                >
                  Limpiar
                </Button>
              </>
            ) : (
              <p className="mt-1 text-xs text-text-secondary">
                Tildá conceptos en la última columna para ver cuánto se ahorra. No cambia
                nada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <p className="text-xs text-text-muted">
            Tocá un monto para cargarlo o cambiarlo. Rige desde ese mes hasta el próximo
            cambio; lo apagado es el monto del mes anterior que sigue vigente.
          </p>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset((o) => o - 1)}
              aria-label="Meses anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset((o) => o + 1)}
              aria-label="Meses siguientes"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-bg-elevated/40">
                <th className="sticky left-0 z-10 min-w-[200px] bg-bg-card px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:px-5">
                  Concepto
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className={`px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest ${
                      m === month ? 'text-accent-purple' : 'text-text-muted'
                    }`}
                  >
                    {shortMonth(m)}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Simular
                </th>
              </tr>
            </thead>
            <tbody>
              {HOUSEHOLD_GROUPS.map((group) => {
                const rows = items.filter((item) => item.groupKey === group.id)
                if (rows.length === 0) return null
                return (
                  <GroupRows
                    key={group.id}
                    label={group.label}
                    rows={rows}
                    months={months}
                    month={month}
                    simulated={simulated}
                    sumFor={sumFor}
                    onEdit={setEditing}
                    onToggleSimulate={toggleSimulate}
                  />
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] bg-bg-elevated/40">
                <td className="sticky left-0 z-10 bg-bg-card px-4 py-3 text-sm font-semibold sm:px-5">
                  Total por mes
                </td>
                {months.map((m) => {
                  const missing = missingFor(m)
                  return (
                    <td key={m} className="px-3 py-3 text-right align-top">
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        ≈ {formatARS(roundToThousand(sumFor(items, m)))}
                      </p>
                      {missing > 0 && (
                        <p className="text-[10px] text-accent-yellow">faltan {missing}</p>
                      )}
                    </td>
                  )
                })}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="px-4 py-3 text-[11px] text-text-muted sm:px-5">
          Los dólares se pasan al blue de hoy en todos los meses. Lo que se paga cada varios
          meses (como Apple anual) se reparte por mes en los totales.
        </p>
      </Card>

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

function GroupRows({
  label,
  rows,
  months,
  month,
  simulated,
  sumFor,
  onEdit,
  onToggleSimulate,
}: {
  label: string
  rows: HouseholdItemView[]
  months: string[]
  month: string
  simulated: Set<string>
  sumFor: (list: HouseholdItemView[], m: string) => number
  onEdit: (item: HouseholdItemView) => void
  onToggleSimulate: (id: string) => void
}) {
  return (
    <>
      <tr className="bg-bg-elevated/30">
        <td className="sticky left-0 z-10 bg-bg-card px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:px-5">
          {label}
        </td>
        {months.map((m) => (
          <td
            key={m}
            className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-text-muted"
          >
            ≈ {formatARS(roundToThousand(sumFor(rows, m)))}
          </td>
        ))}
        <td />
      </tr>
      {rows.map((item) => {
        const isSim = simulated.has(item.id)
        return (
          <tr key={item.id} className="border-b border-[var(--border)]">
            <td className="sticky left-0 z-10 bg-bg-card px-4 py-2.5 sm:px-5">
              <button
                type="button"
                onClick={() => onEdit(item)}
                title={item.notes ?? 'Cambiar frecuencia o sacar de la lista'}
                className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left ${
                  isSim ? 'text-text-muted line-through' : 'text-text-primary'
                } hover:text-accent-purple`}
              >
                <span>{item.name}</span>
                {item.linked && (
                  <Badge variant="blue">
                    <Link2 className="h-2.5 w-2.5" />
                    Préstamo
                  </Badge>
                )}
                {item.monthsPerCharge > 1 && (
                  <Badge variant="muted">
                    {FREQUENCY_OPTIONS.find((o) => o.months === item.monthsPerCharge)?.label ??
                      `Cada ${item.monthsPerCharge} meses`}
                  </Badge>
                )}
              </button>
            </td>
            {months.map((m) => (
              <td key={m} className={`px-1 py-1 text-right ${m === month ? 'bg-accent-purple/5' : ''}`}>
                <AmountCell item={item} month={m} cell={cellAt(item, m)} struck={isSim} />
              </td>
            ))}
            <td className="px-3 py-2.5 text-center">
              <input
                type="checkbox"
                checked={isSim}
                onChange={() => onToggleSimulate(item.id)}
                className="h-4 w-4 accent-[var(--green)]"
                aria-label={`Simular baja de ${item.name}`}
              />
            </td>
          </tr>
        )
      })}
    </>
  )
}

function AmountCell({
  item,
  month,
  cell,
  struck,
}: {
  item: HouseholdItemView
  month: string
  cell: Cell
  struck: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  const text =
    cell.value === null ? '—' : money(cell.value, item.linked ? 'ARS' : item.currency)
  const tone = struck
    ? 'text-text-muted line-through'
    : cell.value === null
      ? 'text-text-muted'
      : cell.explicit
        ? 'text-text-primary'
        : 'text-text-muted'

  if (item.linked) {
    return (
      <span className={`inline-block px-2 py-1.5 font-mono text-xs tabular-nums ${tone}`}>
        {text}
      </span>
    )
  }

  const commit = async () => {
    setEditing(false)
    if (cancelled.current) return
    const next = draft === '' ? null : Number(draft)
    if (next === null || Number.isNaN(next) || next === cell.value) return
    setBusy(true)
    const result = await saveHouseholdItem({
      itemId: item.id,
      month,
      amount: next,
      monthsPerCharge: item.monthsPerCharge,
    })
    setBusy(false)
    if (result.success) toast.success(`Anotado: ${item.name}.`)
    else toast.error(result.error)
  }

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            cancelled.current = true
            event.currentTarget.blur()
          }
        }}
        className="h-8 w-28 text-right font-mono text-xs tabular-nums"
        aria-label={`${item.name} en ${monthLabel(month)}`}
      />
    )
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        cancelled.current = false
        setDraft(cell.value === null ? '' : String(cell.value))
        setEditing(true)
      }}
      className={`w-full rounded-lg px-2 py-1.5 text-right font-mono text-xs tabular-nums hover:bg-bg-elevated ${tone} ${
        busy ? 'opacity-50' : ''
      }`}
    >
      {text}
    </button>
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
