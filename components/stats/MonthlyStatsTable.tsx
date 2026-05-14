'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatUSD, formatARS, formatMonthYear, capitalize } from '@/lib/utils/format'

export type MonthlyRow = {
  year: number
  month: number
  income: number
  purchase: number
  totalIncome: number
  expense: number
  fees: number
  netSavings: number
  totalBalance: number
  arsSpent: number
}

export function MonthlyStatsTable({ rows }: { rows: MonthlyRow[] }) {
  const exportCsv = () => {
    const headers = [
      'Año',
      'Mes',
      'Sueldos',
      'Compras',
      'Total Ingresos',
      'Egresos',
      'Fees',
      'Ahorro Neto',
      'Saldo Total',
    ]
    const lines = [headers.join(',')]
    for (const r of rows) {
      lines.push(
        [
          r.year,
          r.month,
          r.income.toFixed(2),
          r.purchase.toFixed(2),
          r.totalIncome.toFixed(2),
          r.expense.toFixed(2),
          r.fees.toFixed(2),
          r.netSavings.toFixed(2),
          r.totalBalance.toFixed(2),
        ].join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzas_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="font-display text-base font-semibold">Tabla mensual</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Histórico completo. {rows.length} {rows.length === 1 ? 'mes' : 'meses'}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-text-muted bg-bg-elevated/40">
            <tr>
              <Th>Mes</Th>
              <Th align="right">Sueldos</Th>
              <Th align="right">Compras</Th>
              <Th align="right">Ingresos</Th>
              <Th align="right">Egresos</Th>
              <Th align="right">Fees</Th>
              <Th align="right">Ahorro</Th>
              <Th align="right">Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-text-muted">
                  Cuando empiecen a cargar movimientos van a ver el histórico acá.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.year}-${r.month}`} className="border-t border-[var(--border)]">
                  <Td>{capitalize(formatMonthYear(r.year, r.month))}</Td>
                  <Td align="right" mono>USD {formatUSD(r.income)}</Td>
                  <Td align="right" mono tone="muted">
                    {formatARS(r.arsSpent)} → USD {formatUSD(r.purchase)}
                  </Td>
                  <Td align="right" mono tone="positive">
                    USD {formatUSD(r.totalIncome)}
                  </Td>
                  <Td align="right" mono tone="negative">
                    USD {formatUSD(r.expense)}
                  </Td>
                  <Td align="right" mono tone="negative">
                    USD {formatUSD(r.fees)}
                  </Td>
                  <Td align="right" mono tone={r.netSavings >= 0 ? 'positive' : 'negative'}>
                    USD {formatUSD(r.netSavings)}
                  </Td>
                  <Td align="right" mono>
                    USD {formatUSD(r.totalBalance)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th
      className={`py-2 px-3 text-[10px] uppercase tracking-wider font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}
function Td({
  children,
  align,
  mono,
  tone,
}: {
  children: React.ReactNode
  align?: 'right'
  mono?: boolean
  tone?: 'positive' | 'negative' | 'muted'
}) {
  const colors =
    tone === 'positive'
      ? 'text-accent-green'
      : tone === 'negative'
        ? 'text-accent-red'
        : tone === 'muted'
          ? 'text-text-muted'
          : 'text-text-primary'
  return (
    <td
      className={`py-2 px-3 ${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'font-mono tabular-nums' : ''} ${colors}`}
    >
      {children}
    </td>
  )
}
