'use client'

import { useState } from 'react'
import { Banknote, Landmark, LockKeyhole, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteHorizonContribution } from '@/actions/horizon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { HorizonContribution } from '@/lib/db/schema'
import { formatARS, formatDateShort, toNumber } from '@/lib/utils/format'

function paymentLabel(contribution: HorizonContribution) {
  if (contribution.paymentMethod === 'cash') return 'Efectivo'
  if (contribution.paymentMethod === 'transfer') {
    return contribution.transferFrom
      ? `Transferencia · ${contribution.transferFrom}`
      : 'Transferencia'
  }
  return 'Forma de pago sin informar'
}

export function HorizonContributionHistory({
  contributions,
}: {
  contributions: HorizonContribution[]
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!window.confirm('¿Borrás este aporte? Los porcentajes se van a recalcular.')) return
    setDeletingId(id)
    const result = await deleteHorizonContribution(id)
    setDeletingId(null)
    if (result.success) toast.success('Aporte eliminado.')
    else toast.error(result.error)
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {contributions.map((contribution) => {
        const imported = Boolean(contribution.importKey)
        const PaymentIcon =
          contribution.paymentMethod === 'cash' ? Banknote : Landmark
        return (
          <div
            key={contribution.id}
            className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr_auto] gap-3 px-4 sm:px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-text-primary">
                  {formatDateShort(contribution.paidOn)}
                </p>
                {contribution.countsForSeniority && (
                  <Badge variant="green">Suma antigüedad</Badge>
                )}
                {imported && (
                  <Badge variant="muted">
                    <LockKeyhole className="h-2.5 w-2.5" />
                    Excel
                  </Badge>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <PaymentIcon className="h-3.5 w-3.5" />
                {paymentLabel(contribution)}
              </p>
              {contribution.creditedOn && (
                <p className="text-[11px] text-text-muted mt-1">
                  Acreditado {formatDateShort(contribution.creditedOn)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Total</p>
                <p className="font-mono tabular-nums text-xs sm:text-sm mt-1">
                  {formatARS(contribution.grossAmountArs)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Gastos</p>
                <p className="font-mono tabular-nums text-xs sm:text-sm text-accent-orange mt-1">
                  {formatARS(contribution.expensesAmountArs)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Vivienda</p>
                <p className="font-mono tabular-nums text-xs sm:text-sm text-accent-green mt-1">
                  {formatARS(contribution.housingAmountArs)}
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-end justify-between md:justify-center gap-2">
              {!contribution.includedInOpeningSnapshot &&
                toNumber(contribution.acquiredPercentage) > 0 && (
                  <Badge variant="blue">
                    +{toNumber(contribution.acquiredPercentage).toLocaleString('es-AR', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                    %
                  </Badge>
                )}
              {!imported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-text-muted hover:text-accent-red"
                  onClick={() => remove(contribution.id)}
                  disabled={deletingId === contribution.id}
                  title="Eliminar aporte"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {(contribution.receiptReference || contribution.notes) && (
              <div className="md:col-span-3 text-[11px] text-text-muted">
                {contribution.receiptReference && (
                  <span>Recibo: {contribution.receiptReference}</span>
                )}
                {contribution.receiptReference && contribution.notes && (
                  <span> · </span>
                )}
                {contribution.notes && <span>{contribution.notes}</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
