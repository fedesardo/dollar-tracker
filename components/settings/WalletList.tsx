'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/components/shared/Amount'
import { WalletIcon } from '@/components/shared/WalletIcon'
import { WalletForm } from './WalletForm'
import { archiveWallet, restoreWallet, deleteWallet } from '@/actions/wallets'
import type { Wallet, WalletType, Owner } from '@/lib/db/schema'
import { calcAllWalletBalances, type LegWithDirection } from '@/lib/utils/calculations'
import { toNumber } from '@/lib/utils/format'

const ownerLabel: Record<Owner, string> = { fede: 'Fede', flor: 'Flor', joint: 'Ambos' }
const typeLabel: Record<WalletType, string> = {
  virtual: 'Virtual',
  physical: 'Físico',
  receivable: 'Pendiente',
}
const typeVariant: Record<WalletType, 'blue' | 'green' | 'purple'> = {
  virtual: 'blue',
  physical: 'green',
  receivable: 'purple',
}

export function WalletList({
  wallets,
  legs,
}: {
  wallets: Wallet[]
  legs: LegWithDirection[]
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const balances = calcAllWalletBalances(wallets, legs)

  const active = wallets.filter((w) => w.isActive)
  const archived = wallets.filter((w) => !w.isActive)
  const maxSort = Math.max(0, ...wallets.map((w) => w.sortOrder))

  const handleArchive = async (id: string) => {
    const res = await archiveWallet(id)
    if (res.success) toast.success('Bolsillo archivado.')
    else toast.error(res.error)
  }

  const handleRestore = async (id: string) => {
    const res = await restoreWallet(id)
    if (res.success) toast.success('Bolsillo restaurado.')
    else toast.error(res.error)
  }

  const handleDelete = async (w: Wallet) => {
    if (!confirm(`¿Eliminar "${w.name}" definitivamente? No hay vuelta atrás.`)) return
    const res = await deleteWallet(w.id)
    if (res.success) toast.success('Bolsillo eliminado.')
    else toast.error(res.error)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Bolsillos</h2>
          <p className="text-xs text-text-muted">
            Gestioná dónde vive la plata. Editá el saldo inicial cuando arranques de cero.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </Button>
      </div>

      <div className="space-y-2">
        {active.map((w) => (
          <Row
            key={w.id}
            wallet={w}
            currentBalance={balances.get(w.id) ?? 0}
            onEdit={() => setEditing(w)}
            onArchive={() => handleArchive(w.id)}
            onDelete={() => handleDelete(w)}
            onRestore={() => handleRestore(w.id)}
          />
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <h3 className="font-display text-sm font-semibold text-text-muted mt-6 mb-2">
            Archivados
          </h3>
          <div className="space-y-2">
            {archived.map((w) => (
              <Row
                key={w.id}
                wallet={w}
                currentBalance={balances.get(w.id) ?? 0}
                archived
                onEdit={() => setEditing(w)}
                onArchive={() => handleArchive(w.id)}
                onDelete={() => handleDelete(w)}
                onRestore={() => handleRestore(w.id)}
              />
            ))}
          </div>
        </>
      )}

      <WalletForm
        open={creating}
        onOpenChange={setCreating}
        defaultSortOrder={maxSort + 1}
      />
      {editing && (
        <WalletForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          wallet={editing}
        />
      )}
    </>
  )
}

function Row({
  wallet,
  currentBalance,
  archived,
  onEdit,
  onArchive,
  onDelete,
  onRestore,
}: {
  wallet: Wallet
  currentBalance: number
  archived?: boolean
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  onRestore: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: archived ? 0.5 : 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-bg-card p-4"
      style={{ borderLeft: `3px solid ${wallet.color}` }}
    >
      <div
        className="rounded-lg p-2 flex items-center justify-center flex-shrink-0"
        style={{ background: `${wallet.color}20`, color: wallet.color }}
      >
        <WalletIcon name={wallet.icon} className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-text-primary truncate">{wallet.name}</h3>
          <Badge variant={typeVariant[wallet.type]}>{typeLabel[wallet.type]}</Badge>
          <Badge variant="muted">{ownerLabel[wallet.owner]}</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs mt-1">
          <span className="text-text-muted">
            Inicial:{' '}
            <span className="font-mono tabular-nums text-text-secondary">
              USD {toNumber(wallet.initialBalance).toFixed(2)}
            </span>
          </span>
          <span className="text-text-muted">→</span>
          <span className="text-text-muted">
            Hoy:{' '}
            <Amount value={currentBalance} size="xs" showPrefix={false} />
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {archived ? (
          <Button variant="ghost" size="icon" onClick={onRestore} className="h-8 w-8 text-accent-green">
            <ArchiveRestore className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onArchive} className="h-8 w-8">
            <Archive className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-text-muted hover:text-accent-red"
          title="Eliminar definitivamente (solo si no tiene movimientos)"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
