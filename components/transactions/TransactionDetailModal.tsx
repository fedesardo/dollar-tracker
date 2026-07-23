'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/shared/Amount'
import { TransactionBadge } from '@/components/shared/TransactionBadge'
import { IncomeForm } from './forms/IncomeForm'
import { deleteTransaction } from '@/actions/transactions'
import type { Wallet } from '@/lib/db/schema'
import type { TransactionWithLegs } from '@/lib/queries/transactions'
import { formatARS, formatDate, formatRate, formatUSD, toNumber } from '@/lib/utils/format'

export function TransactionDetailModal({
  open,
  onOpenChange,
  tx,
  wallets,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  tx: TransactionWithLegs | null
  wallets: Wallet[]
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirmDel(false)
      setEditing(false)
    }
  }, [open])

  if (!tx) return null

  const walletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? '—'
  const canEdit = tx.type === 'income'

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteTransaction(tx.id)
    setDeleting(false)
    if (res.success) {
      toast.success('Transacción borrada.')
      setConfirmDel(false)
      onOpenChange(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TransactionBadge type={tx.type} />
            <span className="text-base">{editing ? 'Editar sueldo' : 'Detalle'}</span>
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <IncomeForm
            wallets={wallets}
            transaction={tx}
            onDone={() => {
              setEditing(false)
              onOpenChange(false)
            }}
          />
        ) : (
          <>
            <div className="space-y-3 text-sm">
              <Row label="Fecha" value={formatDate(tx.date)} capitalize />
              <Row label="Descripción" value={tx.description} />
              <Row
                label="Monto"
                value={<Amount value={toNumber(tx.amountUsd)} size="md" showPrefix />}
              />

              {tx.type === 'purchase' && (
                <>
                  <Row label="ARS gastados" value={formatARS(toNumber(tx.amountArs))} />
                  <Row label="Cotización" value={formatRate(toNumber(tx.exchangeRate))} />
                </>
              )}

              {tx.type === 'cash_out' && (
                <>
                  <Row label="Bruto" value={`USD ${formatUSD(toNumber(tx.grossAmount))}`} />
                  <Row
                    label="Comisión"
                    value={`${toNumber(tx.feePercentage).toFixed(2)}% · USD ${formatUSD(toNumber(tx.feeUsd))}`}
                    tone="negative"
                  />
                  <Row
                    label="Neto recibido"
                    value={`USD ${formatUSD(toNumber(tx.amountUsd))}`}
                    tone="positive"
                  />
                </>
              )}

              {tx.beneficiary && (
                <Row
                  label="Para"
                  value={tx.beneficiary === 'flor' ? 'Flor' : tx.beneficiary === 'fede' ? 'Fede' : 'Ambos'}
                />
              )}
              {tx.category && <Row label="Categoría" value={tx.category} />}
              {tx.recurringIncomeId && (
                <Row label="Origen" value="Ingreso automático" tone="positive" />
              )}

              {tx.legs.length > 0 && (
                <div className="rounded-xl bg-bg-elevated p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Bolsillos afectados
                  </p>
                  {tx.legs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">
                        {l.direction === 'in' ? '↓' : '↑'} {walletName(l.walletId)}
                      </span>
                      <span
                        className={`font-mono tabular-nums ${
                          l.direction === 'in' ? 'text-accent-green' : 'text-accent-red'
                        }`}
                      >
                        {l.direction === 'in' ? '+' : '−'} USD {formatUSD(toNumber(l.amountUsd))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {tx.notes && (
                <div className="rounded-xl border border-[var(--border)] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Notas</p>
                  <p className="text-text-secondary">{tx.notes}</p>
                </div>
              )}
            </div>

            {!confirmDel ? (
              <div className="flex justify-end gap-2 pt-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => setConfirmDel(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-3 space-y-2">
                <p className="text-sm text-text-primary">
                  ¿Borrás esta transacción?{' '}
                  <span className="text-text-muted">No hay vuelta atrás.</span>
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Borrando…' : 'Sí, borrar'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  tone,
  capitalize,
}: {
  label: string
  value: React.ReactNode
  tone?: 'positive' | 'negative'
  capitalize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs uppercase tracking-wider text-text-muted">{label}</span>
      <span
        className={`text-sm text-right ${tone === 'positive' ? 'text-accent-green' : tone === 'negative' ? 'text-accent-red' : 'text-text-primary'} ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
