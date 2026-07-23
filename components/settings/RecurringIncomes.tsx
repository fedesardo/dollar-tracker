'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Pause, Play, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecurringIncomeForm } from './RecurringIncomeForm'
import { toggleRecurringIncome, deleteRecurringIncome } from '@/actions/recurringIncomes'
import type { Wallet, RecurringIncome } from '@/lib/db/schema'
import { toNumber, formatDateShort } from '@/lib/utils/format'

export function RecurringIncomes({
  rules,
  wallets,
}: {
  rules: RecurringIncome[]
  wallets: Wallet[]
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<RecurringIncome | null>(null)

  const walletById = (id: string) => wallets.find((w) => w.id === id)

  const handleToggle = async (rule: RecurringIncome) => {
    const res = await toggleRecurringIncome(rule.id, !rule.isActive)
    if (res.success) {
      toast.success(rule.isActive ? 'Regla pausada.' : 'Regla activada.')
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async (rule: RecurringIncome) => {
    if (!confirm(`¿Eliminar la regla "${rule.description}"? Las transacciones ya creadas no se borran.`)) return
    const res = await deleteRecurringIncome(rule.id)
    if (res.success) toast.success('Regla eliminada.')
    else toast.error(res.error)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Ingresos automáticos</h2>
          <p className="text-xs text-text-muted">
            Sueldos que se registran solos cada mes. Editás la transacción después si el monto cambió.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-bg-card/50 p-6 text-center">
          <p className="text-sm text-text-muted">
            Ninguna regla activa. Creá una y olvidate de cargar el sueldo todos los meses.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const wallet = walletById(rule.walletId)
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: rule.isActive ? 1 : 0.55, y: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-bg-card p-4"
                style={wallet ? { borderLeft: `3px solid ${wallet.color}` } : undefined}
              >
                <div className="rounded-lg p-2 flex items-center justify-center flex-shrink-0 bg-accent-cyan/10 text-accent-cyan">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {rule.description}
                    </h3>
                    {rule.isActive ? (
                      <Badge variant="green">Activa</Badge>
                    ) : (
                      <Badge variant="muted">Pausada</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
                    <span className="text-text-muted">
                      Día{' '}
                      <span className="font-mono tabular-nums text-text-secondary">
                        {rule.dayOfMonth}
                      </span>
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">
                      <span className="font-mono tabular-nums text-text-secondary">
                        USD {toNumber(rule.amountUsd).toFixed(2)}
                      </span>
                    </span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-secondary">{wallet?.name ?? '—'}</span>
                    {rule.lastRunOn && (
                      <>
                        <span className="text-text-muted">·</span>
                        <span className="text-text-muted">
                          Último:{' '}
                          <span className="font-mono tabular-nums text-text-secondary">
                            {formatDateShort(rule.lastRunOn)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(rule)}
                    className="h-8 w-8"
                    title={rule.isActive ? 'Pausar' : 'Activar'}
                  >
                    {rule.isActive ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-accent-green" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(rule)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule)}
                    className="h-8 w-8 text-text-muted hover:text-accent-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <RecurringIncomeForm
        open={creating}
        onOpenChange={setCreating}
        wallets={wallets}
      />
      {editing && (
        <RecurringIncomeForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          wallets={wallets}
          rule={editing}
        />
      )}
    </>
  )
}
