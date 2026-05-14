'use client'

import { useMemo, useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionBadge, transactionMeta } from '@/components/shared/TransactionBadge'
import { TransactionDetailModal } from './TransactionDetailModal'
import type { Wallet, TransactionType } from '@/lib/db/schema'
import type { TransactionWithLegs } from '@/lib/queries/transactions'
import { formatDateShort, formatUSD, toNumber, capitalize } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const ALL_TYPES: TransactionType[] = [
  'income',
  'expense',
  'purchase',
  'transfer',
  'cash_out',
  'loan_out',
  'loan_in',
]

const PAGE_SIZE = 25

function netForTx(tx: TransactionWithLegs): { value: number; sign: 'in' | 'out' | 'neutral' } {
  switch (tx.type) {
    case 'income':
    case 'purchase':
    case 'loan_in':
      return { value: toNumber(tx.amountUsd), sign: 'in' }
    case 'expense':
    case 'loan_out':
      return { value: toNumber(tx.amountUsd), sign: 'out' }
    case 'transfer':
      return { value: toNumber(tx.amountUsd), sign: 'neutral' }
    case 'cash_out':
      return { value: toNumber(tx.feeUsd), sign: 'out' }
  }
}

export function TransactionList({
  transactions,
  wallets,
}: {
  transactions: TransactionWithLegs[]
  wallets: Wallet[]
}) {
  const [search, setSearch] = useState('')
  const [filterTypes, setFilterTypes] = useState<TransactionType[]>([])
  const [filterWallets, setFilterWallets] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<TransactionWithLegs | null>(null)

  const walletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? '—'

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterTypes.length > 0 && !filterTypes.includes(t.type)) return false
      if (filterWallets.length > 0) {
        const hit = t.legs.some((l) => filterWallets.includes(l.walletId))
        if (!hit) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!t.description.toLowerCase().includes(q) && !(t.notes ?? '').toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [transactions, filterTypes, filterWallets, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // Group by month
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; net: number; items: TransactionWithLegs[] }>()
    for (const t of paged) {
      const d = new Date(t.date + 'T00:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = capitalize(d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }))
      if (!map.has(key)) map.set(key, { label, net: 0, items: [] })
      const g = map.get(key)!
      g.items.push(t)
      const n = netForTx(t)
      if (n.sign === 'in') g.net += n.value
      else if (n.sign === 'out') g.net -= n.value
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([_, v]) => v)
  }, [paged])

  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

  const clearFilters = () => {
    setFilterTypes([])
    setFilterWallets([])
    setSearch('')
    setPage(1)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por descripción o nota…"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TYPES.map((t) => {
                      const active = filterTypes.includes(t)
                      const meta = transactionMeta(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setFilterTypes(toggle(filterTypes, t))
                            setPage(1)
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border transition-colors',
                            active
                              ? `bg-accent-${meta.variant}/10 border-accent-${meta.variant}/30 text-accent-${meta.variant}`
                              : 'border-[var(--border)] text-text-secondary hover:text-text-primary',
                          )}
                        >
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Bolsillo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wallets.map((w) => {
                      const active = filterWallets.includes(w.id)
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setFilterWallets(toggle(filterWallets, w.id))
                            setPage(1)
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border transition-colors',
                            active
                              ? 'bg-bg-elevated border-[var(--border-hover)] text-text-primary'
                              : 'border-[var(--border)] text-text-secondary',
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: w.color }} />
                          {w.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {(filterTypes.length > 0 || filterWallets.length > 0 || search) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-3 w-3" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-bg-card/50 p-10 text-center">
            <p className="text-sm text-text-muted">
              No hay movimientos con esos filtros.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-text-muted">
                    {g.label}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span
                    className={cn(
                      'text-xs font-mono tabular-nums',
                      g.net >= 0 ? 'text-accent-green' : 'text-accent-red',
                    )}
                  >
                    USD {g.net >= 0 ? '+' : '−'}
                    {formatUSD(Math.abs(g.net))} neto
                  </span>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-bg-card overflow-hidden">
                  {g.items.map((tx, idx) => (
                    <Row
                      key={tx.id}
                      tx={tx}
                      walletName={walletName}
                      isLast={idx === g.items.length - 1}
                      onClick={() => setSelected(tx)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-text-muted">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </Button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <TransactionDetailModal
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        tx={selected}
        wallets={wallets}
      />
    </>
  )
}

function Row({
  tx,
  walletName,
  isLast,
  onClick,
}: {
  tx: TransactionWithLegs
  walletName: (id: string) => string
  isLast: boolean
  onClick: () => void
}) {
  const net = netForTx(tx)
  const involvedWallets = tx.legs.map((l) => walletName(l.walletId)).join(' + ')
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-elevated/40 transition-colors text-left',
        !isLast && 'border-b border-[var(--border)]',
      )}
    >
      <div className="text-[11px] text-text-muted w-12 flex-shrink-0 font-mono tabular-nums">
        {formatDateShort(tx.date)}
      </div>
      <div className="flex-shrink-0">
        <TransactionBadge type={tx.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{tx.description}</p>
        <p className="text-[11px] text-text-muted truncate">{involvedWallets}</p>
      </div>
      <div
        className={cn(
          'text-sm font-mono tabular-nums whitespace-nowrap',
          net.sign === 'in'
            ? 'text-accent-green'
            : net.sign === 'out'
              ? 'text-accent-red'
              : 'text-text-secondary',
        )}
      >
        {net.sign === 'in' ? '+' : net.sign === 'out' ? '−' : ''} USD {formatUSD(net.value)}
        {tx.type === 'cash_out' && (
          <Badge variant="orange" className="ml-2">
            -{toNumber(tx.feePercentage).toFixed(1)}%
          </Badge>
        )}
      </div>
    </button>
  )
}
