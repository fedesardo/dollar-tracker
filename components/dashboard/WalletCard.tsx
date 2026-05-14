'use client'

import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { Amount } from '@/components/shared/Amount'
import { Badge } from '@/components/ui/badge'
import { WalletIcon } from '@/components/shared/WalletIcon'
import { formatARS, formatPct, formatUSD } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Wallet, Owner, WalletType } from '@/lib/db/schema'
import { differenceInDays } from 'date-fns'

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

export type WalletCardData = {
  wallet: Wallet
  balance: number
  prevBalance: number
  history: { month: string; value: number }[]
  blueRate: number | null
  lastMovementAt: Date | null
}

export function WalletCard({ data }: { data: WalletCardData }) {
  const { wallet, balance, prevBalance, history, blueRate, lastMovementAt } = data
  const delta = balance - prevBalance
  const deltaPct = prevBalance !== 0 ? (delta / Math.abs(prevBalance)) * 100 : 0
  const positive = delta >= 0

  const stale =
    wallet.type === 'receivable' &&
    lastMovementAt &&
    differenceInDays(new Date(), lastMovementAt) > 30

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-bg-card p-5 transition-all hover:border-[var(--border-hover)]"
      style={{
        borderLeft: `3px solid ${wallet.color}`,
        boxShadow: 'none',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          boxShadow: `inset 0 0 60px ${wallet.color}10`,
        }}
      />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="rounded-lg p-2 flex items-center justify-center"
            style={{ background: `${wallet.color}20`, color: wallet.color }}
          >
            <WalletIcon name={wallet.icon} className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{wallet.name}</h3>
            <Badge variant={typeVariant[wallet.type]} className="mt-1">
              {typeLabel[wallet.type]}
            </Badge>
          </div>
        </div>
        <Badge variant="muted">{ownerLabel[wallet.owner]}</Badge>
      </div>

      <div className="relative z-10 space-y-1">
        <Amount value={balance} size="lg" showPrefix={false} className="text-text-primary" />
        {blueRate && (
          <p className="text-[11px] text-text-muted">≈ {formatARS(balance * blueRate)}</p>
        )}
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1 font-mono tabular-nums',
            positive ? 'text-accent-green' : 'text-accent-red',
          )}
        >
          {positive ? '▲' : '▼'} {formatUSD(Math.abs(delta))} · {formatPct(deltaPct, { sign: true })}
        </span>
        <span className="text-text-muted">vs mes anterior</span>
      </div>

      {history.length > 1 && (
        <div className="relative z-10 mt-3 h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${wallet.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={wallet.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={wallet.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={wallet.color}
                strokeWidth={1.5}
                fill={`url(#spark-${wallet.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {stale && (
        <Badge variant="orange" className="relative z-10 mt-3">
          ⚠ Capital inmovilizado
        </Badge>
      )}
    </motion.div>
  )
}
