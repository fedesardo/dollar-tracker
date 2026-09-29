'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { createCarInsuranceOffer, updateCarInsuranceOffer } from '@/actions/carInsurance'
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
import {
  COVERAGE_CATALOG,
  COVERAGE_CATEGORIES,
  COVERAGE_STATUSES,
  COVERAGE_STATUS_LABEL,
  emptyCoverages,
  type CoverageMap,
  type CoverageStatus,
} from '@/lib/utils/carInsurance'

export type EditableOffer = {
  id: string
  insurer: string
  planName: string
  monthlyPremiumArs: string | null
  validFrom: string | null
  insuredSumArs: string | null
  notes: string | null
  coverages: CoverageMap
}

export function InsuranceOfferForm({
  open,
  onOpenChange,
  currentCoverages,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCoverages: CoverageMap
  editing?: EditableOffer | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar oferta' : 'Cargar oferta de seguro'}</DialogTitle>
          <DialogDescription>
            Lo que te pase tu productor. Lo que no sepas dejalo en “Preguntar” y lo
            completás después.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir, así el formulario arranca limpio cada vez. */}
        <OfferFormBody
          currentCoverages={currentCoverages}
          editing={editing ?? null}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function OfferFormBody({
  currentCoverages,
  editing,
  onDone,
}: {
  currentCoverages: CoverageMap
  editing: EditableOffer | null
  onDone: () => void
}) {
  const [insurer, setInsurer] = useState(editing?.insurer ?? '')
  const [planName, setPlanName] = useState(editing?.planName ?? '')
  const [premium, setPremium] = useState(editing?.monthlyPremiumArs ?? '')
  const [validFrom, setValidFrom] = useState(editing?.validFrom ?? '')
  const [insuredSum, setInsuredSum] = useState(editing?.insuredSumArs ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [coverages, setCoverages] = useState<CoverageMap>(
    editing?.coverages ?? emptyCoverages(),
  )
  const [submitting, setSubmitting] = useState(false)

  const setCoverage = (key: string, patch: Partial<CoverageMap[string]>) =>
    setCoverages((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      insurer,
      planName,
      monthlyPremiumArs: premium ? Number(premium) : null,
      validFrom: validFrom || null,
      insuredSumArs: insuredSum ? Number(insuredSum) : null,
      notes: notes || null,
      coverages,
    }
    setSubmitting(true)
    const result = editing
      ? await updateCarInsuranceOffer(editing.id, payload)
      : await createCarInsuranceOffer(payload)
    setSubmitting(false)
    if (result.success) {
      toast.success(editing ? 'Oferta actualizada.' : 'Dale. Oferta guardada.')
      onDone()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ins-insurer">¿Qué compañía?</Label>
            <Input
              id="ins-insurer"
              value={insurer}
              onChange={(event) => setInsurer(event.target.value)}
              placeholder="Ej: Sancor"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-plan">¿Qué plan?</Label>
            <Input
              id="ins-plan"
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Ej: Todo riesgo con franquicia"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-premium">¿Cuánto sale por mes?</Label>
            <Input
              id="ins-premium"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={premium}
              onChange={(event) => setPremium(event.target.value)}
              className="font-mono tabular-nums"
              placeholder="140000"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-sum">Suma asegurada del auto</Label>
            <Input
              id="ins-sum"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={insuredSum}
              onChange={(event) => setInsuredSum(event.target.value)}
              className="font-mono tabular-nums"
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-from">¿Desde cuándo rige?</Label>
            <Input
              id="ins-from"
              type="date"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Qué cubre</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCoverages(JSON.parse(JSON.stringify(currentCoverages)))}
          >
            <Copy className="h-3.5 w-3.5" />
            Arrancar con lo de Mapfre
          </Button>
        </div>

        {COVERAGE_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {category.label}
            </p>
            {COVERAGE_CATALOG.filter((item) => item.category === category.id).map(
              (item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--border)] bg-bg-elevated/40 p-3 sm:grid-cols-[1fr_170px]"
                >
                  <p className="text-sm sm:col-span-2">{item.label}</p>
                  <Input
                    value={coverages[item.key]?.detail ?? ''}
                    onChange={(event) => setCoverage(item.key, { detail: event.target.value })}
                    placeholder="Monto, franquicia, límite…"
                    aria-label={`${item.label}: detalle`}
                  />
                  <Select
                    value={coverages[item.key]?.status ?? 'unknown'}
                    onValueChange={(value: CoverageStatus) =>
                      setCoverage(item.key, { status: value })
                    }
                  >
                    <SelectTrigger aria-label={`${item.label}: estado`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVERAGE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {COVERAGE_STATUS_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ),
            )}
          </div>
        ))}

        <div className="space-y-1.5">
          <Label htmlFor="ins-notes">Notas</Label>
          <Textarea
            id="ins-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Algo que te dijo el productor, descuentos, condiciones de pago…"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar oferta'}
        </Button>
      </div>
    </form>
  )
}
