'use client'

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatARS, formatRate } from '@/lib/utils/format'

export type PurchaseDot = {
  date: string
  rate: number
  blueAtDate: number
  arsAmount: number
  usdAmount: number
}

export function PurchaseVsBlueChart({
  blueLine,
  purchases,
}: {
  blueLine: { date: string; value: number }[]
  purchases: PurchaseDot[]
}) {
  const data = blueLine.map((b) => ({
    date: b.date,
    blue: b.value,
    purchase: purchases.find((p) => p.date === b.date)?.rate ?? null,
    purchaseGood: purchases.find((p) => p.date === b.date && p.rate <= p.blueAtDate)?.rate ?? null,
    purchaseBad: purchases.find((p) => p.date === b.date && p.rate > p.blueAtDate)?.rate ?? null,
  }))

  // Add purchases that don't have an aligned blue date
  for (const p of purchases) {
    if (!data.find((d) => d.date === p.date)) {
      data.push({
        date: p.date,
        blue: p.blueAtDate,
        purchase: p.rate,
        purchaseGood: p.rate <= p.blueAtDate ? p.rate : null,
        purchaseBad: p.rate > p.blueAtDate ? p.rate : null,
      })
    }
  }
  data.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1 flex items-center gap-1.5">
        Compras vs Blue
        <InfoTooltip
          text="La línea amarilla es la cotización blue diaria. Cada punto es una compra de USD que hiciste. Si está por debajo de la línea = compraste más barato que el blue del día. Si está arriba = pagaste de más."
          size="sm"
        />
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Verde = compraste por debajo del blue · Rojo = compraste por encima
      </p>
      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#7878a0' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7878a0' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTip purchases={purchases} />} />
            <Line type="monotone" dataKey="blue" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
            <Scatter dataKey="purchaseGood" fill="#34d399" />
            <Scatter dataKey="purchaseBad" fill="#f87171" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CustomTip({
  active,
  payload,
  label,
  purchases,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
  purchases: PurchaseDot[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const purchase = purchases.find((p) => p.date === label)
  return (
    <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-3 text-xs shadow-2xl">
      <div className="font-semibold text-text-primary mb-1.5">{label}</div>
      {payload.map((p) =>
        p.dataKey === 'blue' && p.value ? (
          <div key="blue" className="flex justify-between gap-4">
            <span className="text-accent-yellow">Blue</span>
            <span className="font-mono tabular-nums text-text-primary">{formatRate(p.value)}</span>
          </div>
        ) : null,
      )}
      {purchase && (
        <>
          <div className="flex justify-between gap-4 mt-1">
            <span
              className={
                purchase.rate <= purchase.blueAtDate ? 'text-accent-green' : 'text-accent-red'
              }
            >
              Tu compra
            </span>
            <span className="font-mono tabular-nums text-text-primary">{formatRate(purchase.rate)}</span>
          </div>
          <div className="text-text-muted text-[10px] mt-1">
            {formatARS(purchase.arsAmount)} → USD {purchase.usdAmount.toFixed(2)}
          </div>
        </>
      )}
    </div>
  )
}
