'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCarInsuranceOffer } from '@/actions/carInsurance'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  COVERAGE_CATALOG,
  COVERAGE_CATEGORIES,
  coverageDiffers,
  type CoverageMap,
} from '@/lib/utils/carInsurance'
import { formatARS } from '@/lib/utils/format'
import { CoverageStatusIcon } from './CoverageStatusIcon'
import { InsuranceOfferForm, type EditableOffer } from './InsuranceOfferForm'

type PolicyView = EditableOffer & { kind: 'current' | 'offer' }

export function InsuranceCompare({
  current,
  offers,
}: {
  current: PolicyView
  offers: PolicyView[]
}) {
  const [onlyDiffs, setOnlyDiffs] = useState(false)
  const [editing, setEditing] = useState<EditableOffer | null>(null)
  const policies = [current, ...offers]
  const currentPremium = current.monthlyPremiumArs ? Number(current.monthlyPremiumArs) : null

  const remove = async (offer: EditableOffer) => {
    if (!window.confirm(`¿Borrás la oferta de ${offer.insurer}? No hay vuelta atrás.`)) return
    const result = await deleteCarInsuranceOffer(offer.id)
    if (result.success) toast.success('Oferta eliminada.')
    else toast.error(result.error)
  }

  if (offers.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-text-muted">
        Todavía no cargaste ninguna oferta. Cuando tu productor te pase una cotización,
        cargala con “Cargar oferta” y la ponemos al lado de Mapfre.
      </p>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={onlyDiffs}
            onChange={(event) => setOnlyDiffs(event.target.checked)}
            className="h-4 w-4 accent-[var(--green)]"
          />
          Ver solo lo que cambia
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-[var(--border)] bg-bg-elevated/40 text-left">
              <th className="w-[26%] px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:px-5">
                &nbsp;
              </th>
              {policies.map((policy) => (
                <th key={policy.id} className="px-3 py-3 align-top font-normal">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-primary">{policy.insurer}</p>
                      <p className="text-xs text-text-muted">{policy.planName}</p>
                      {policy.kind === 'current' && (
                        <Badge variant="green" className="mt-1.5">
                          Vigente
                        </Badge>
                      )}
                    </div>
                    {policy.kind === 'offer' && (
                      <div className="flex flex-shrink-0 gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(policy)}
                          aria-label="Editar oferta"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(policy)}
                          aria-label="Borrar oferta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="px-4 py-3 text-text-secondary sm:px-5">Por mes</td>
              {policies.map((policy) => {
                const premium = policy.monthlyPremiumArs ? Number(policy.monthlyPremiumArs) : null
                const delta =
                  policy.kind === 'offer' && premium && currentPremium
                    ? ((premium - currentPremium) / currentPremium) * 100
                    : null
                return (
                  <td key={policy.id} className="px-3 py-3 align-top">
                    <p className="font-mono tabular-nums">
                      {premium ? formatARS(premium) : '—'}
                    </p>
                    {delta !== null && (
                      <p
                        className={`font-mono tabular-nums text-[11px] ${delta <= 0 ? 'text-accent-green' : 'text-accent-orange'}`}
                      >
                        {delta > 0 ? '+' : ''}
                        {delta.toLocaleString('es-AR', { maximumFractionDigits: 1 })}% vs Mapfre
                      </p>
                    )}
                  </td>
                )
              })}
            </tr>

            <tr className="border-b border-[var(--border)]">
              <td className="px-4 py-3 text-text-secondary sm:px-5">Valor asegurado</td>
              {policies.map((policy) => (
                <td key={policy.id} className="px-3 py-3 align-top">
                  <p className="font-mono tabular-nums">
                    {policy.insuredSumArs ? formatARS(policy.insuredSumArs) : '—'}
                  </p>
                </td>
              ))}
            </tr>

            {COVERAGE_CATEGORIES.map((category) => {
              const items = COVERAGE_CATALOG.filter(
                (item) =>
                  item.category === category.id &&
                  (!onlyDiffs ||
                    coverageDiffers(policies.map((p) => p.coverages[item.key]))),
              )
              if (items.length === 0) return null
              return (
                <CategoryRows
                  key={category.id}
                  label={category.label}
                  items={items}
                  policies={policies}
                  colSpan={policies.length + 1}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <InsuranceOfferForm
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        currentCoverages={current.coverages}
        editing={editing}
      />
    </>
  )
}

function CategoryRows({
  label,
  items,
  policies,
  colSpan,
}: {
  label: string
  items: (typeof COVERAGE_CATALOG)[number][]
  policies: { id: string; coverages: CoverageMap }[]
  colSpan: number
}) {
  return (
    <>
      <tr className="bg-bg-elevated/30">
        <td
          colSpan={colSpan}
          className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:px-5"
        >
          {label}
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.key} className="border-b border-[var(--border)]">
          <td className="px-4 py-3 align-top text-text-secondary sm:px-5">{item.label}</td>
          {policies.map((policy) => {
            const value = policy.coverages[item.key]
            return (
              <td key={policy.id} className="px-3 py-3 align-top">
                <div className="flex items-start gap-2">
                  <CoverageStatusIcon status={value.status} />
                  {value.detail && (
                    <p className="text-xs leading-snug text-text-muted">{value.detail}</p>
                  )}
                </div>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
