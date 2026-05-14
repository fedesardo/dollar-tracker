import type { Wallet, Transaction, TransactionLeg } from '@/lib/db/schema'
import { toNumber } from './format'

export type LegWithDirection = Pick<TransactionLeg, 'walletId' | 'direction' | 'amountUsd'>

export function calcWalletBalance(
  wallet: Wallet,
  legs: LegWithDirection[],
): number {
  const initial = toNumber(wallet.initialBalance)
  let delta = 0
  for (const leg of legs) {
    if (leg.walletId !== wallet.id) continue
    const amt = toNumber(leg.amountUsd)
    delta += leg.direction === 'in' ? amt : -amt
  }
  return initial + delta
}

export function calcAllWalletBalances(
  wallets: Wallet[],
  legs: LegWithDirection[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const w of wallets) map.set(w.id, toNumber(w.initialBalance))
  for (const leg of legs) {
    const cur = map.get(leg.walletId) ?? 0
    const amt = toNumber(leg.amountUsd)
    map.set(leg.walletId, cur + (leg.direction === 'in' ? amt : -amt))
  }
  return map
}

export function calcPortfolioTotal(balances: Map<string, number>): number {
  let total = 0
  for (const v of balances.values()) total += v
  return total
}

export type MonthMetrics = {
  income: number
  expense: number
  purchaseUsd: number
  purchaseArs: number
  cashOutFees: number
  netSavings: number
  avgRate: number | null
}

export function calcMonthMetrics(
  transactions: Transaction[],
  year: number,
  month: number,
): MonthMetrics {
  let income = 0
  let expense = 0
  let purchaseUsd = 0
  let purchaseArs = 0
  let cashOutFees = 0
  let weightedRateNum = 0
  let weightedRateDen = 0

  for (const t of transactions) {
    const d = new Date(t.date + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue
    switch (t.type) {
      case 'income':
        income += toNumber(t.amountUsd)
        break
      case 'expense':
        expense += toNumber(t.amountUsd)
        break
      case 'purchase': {
        const usd = toNumber(t.amountUsd)
        const ars = toNumber(t.amountArs)
        purchaseUsd += usd
        purchaseArs += ars
        if (usd > 0 && ars > 0) {
          weightedRateNum += ars
          weightedRateDen += usd
        }
        break
      }
      case 'cash_out':
        cashOutFees += toNumber(t.feeUsd)
        break
      default:
        break
    }
  }

  const avgRate = weightedRateDen > 0 ? weightedRateNum / weightedRateDen : null
  // Net savings (cash perspective): income + purchases (new USD entering) - expense - fees
  const netSavings = income + purchaseUsd - expense - cashOutFees
  return { income, expense, purchaseUsd, purchaseArs, cashOutFees, netSavings, avgRate }
}

export function monthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/**
 * Build the running portfolio total by month, starting from initialBalance sums.
 * Returns an array sorted ascending by year/month with the running total at end of that month.
 */
export function calcMonthlyEvolution(
  wallets: Wallet[],
  txs: (Transaction & { legs: LegWithDirection[] })[],
  monthsBack: number,
): { year: number; month: number; label: string; total: number; byWallet: Record<string, number> }[] {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1)

  const balances = new Map<string, number>()
  for (const w of wallets) balances.set(w.id, toNumber(w.initialBalance))

  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date))

  // Apply legs that happened BEFORE the window start to roll forward initial state
  let txIdx = 0
  while (txIdx < sorted.length) {
    const t = sorted[txIdx]
    const d = new Date(t.date + 'T00:00:00')
    if (d >= start) break
    for (const leg of t.legs) {
      const cur = balances.get(leg.walletId) ?? 0
      const amt = toNumber(leg.amountUsd)
      balances.set(leg.walletId, cur + (leg.direction === 'in' ? amt : -amt))
    }
    txIdx++
  }

  const out: ReturnType<typeof calcMonthlyEvolution> = []
  for (let i = 0; i <= monthsBack; i++) {
    const m = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59)
    while (txIdx < sorted.length) {
      const t = sorted[txIdx]
      const d = new Date(t.date + 'T00:00:00')
      if (d > monthEnd) break
      for (const leg of t.legs) {
        const cur = balances.get(leg.walletId) ?? 0
        const amt = toNumber(leg.amountUsd)
        balances.set(leg.walletId, cur + (leg.direction === 'in' ? amt : -amt))
      }
      txIdx++
    }
    let total = 0
    const byWallet: Record<string, number> = {}
    for (const [id, v] of balances) {
      total += v
      byWallet[id] = v
    }
    out.push({
      year: m.getFullYear(),
      month: m.getMonth() + 1,
      label: m.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
      total,
      byWallet,
    })
  }
  return out
}

export function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(-9999, Math.min(9999, n))
}
