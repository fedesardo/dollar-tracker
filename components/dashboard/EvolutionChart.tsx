'use client'

import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts'
import type { Wallet } from '@/lib/db/schema'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatUSD, formatRate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export type EvolutionPoint = {
  label: string
  total: number
  blue: number | null
  byWallet: Record<string, number>
}

export function EvolutionChart({
  data,
  wallets,
}: {
  data: EvolutionPoint[]
  wallets: Wallet[]
}) {
  const [mode, setMode] = useState<'total' | 'byWallet'>('total')

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-1.5">
            Evolución
            <InfoTooltip
              text="Cómo creció (o cayó) el patrimonio total mes a mes. La línea amarilla punteada es la cotización del blue al cierre del mes — sirve para ver si el dólar subió o bajó respecto al ahorro."
              size="sm"
            />
          </h3>
          <p className="text-xs text-text-muted">Saldo total mes a mes</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-bg-elevated p-1 text-xs">
          <button
            onClick={() => setMode('total')}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              mode === 'total'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Total
          </button>
          <button
            onClick={() => setMode('byWallet')}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              mode === 'byWallet'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Por bolsillo
          </button>
        </div>
      </div>

      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'total' ? (
            <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#7878a0"
                tick={{ fontSize: 11, fill: '#7878a0' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#7878a0"
                tick={{ fontSize: 11, fill: '#7878a0' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#fbbf24"
                tick={{ fontSize: 10, fill: '#fbbf24' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip content={<CustomTooltip wallets={wallets} mode={mode} />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#totalGrad)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="blue"
                stroke="#fbbf24"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#7878a0"
                tick={{ fontSize: 11, fill: '#7878a0' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#7878a0"
                tick={{ fontSize: 11, fill: '#7878a0' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip wallets={wallets} mode={mode} />} />
              {wallets.map((w) => (
                <Line
                  key={w.id}
                  type="monotone"
                  dataKey={(d: EvolutionPoint) => d.byWallet[w.id] ?? 0}
                  name={w.name}
                  stroke={w.color}
                  strokeWidth={1.5}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
  wallets,
  mode,
}: {
  active?: boolean
  payload?: Array<{ payload: EvolutionPoint; value: number; color: string }>
  label?: string
  wallets: Wallet[]
  mode: 'total' | 'byWallet'
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-3 text-xs shadow-2xl">
      <div className="font-semibold text-text-primary mb-2 capitalize">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-text-secondary">Total</span>
          <span className="font-mono tabular-nums text-text-primary">
            USD {formatUSD(point.total)}
          </span>
        </div>
        {mode === 'byWallet' &&
          wallets.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: w.color }}
                />
                {w.name}
              </span>
              <span className="font-mono tabular-nums text-text-primary">
                USD {formatUSD(point.byWallet[w.id] ?? 0)}
              </span>
            </div>
          ))}
        {point.blue && (
          <div className="flex items-center justify-between gap-6 pt-1 mt-1 border-t border-[var(--border)]">
            <span className="text-accent-yellow">Blue</span>
            <span className="font-mono tabular-nums text-accent-yellow">
              {formatRate(point.blue)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
