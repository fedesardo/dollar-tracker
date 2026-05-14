import { differenceInDays } from 'date-fns'
import type { Transaction, Loan, Wallet } from '@/lib/db/schema'
import { toNumber } from './format'
import { calcAllWalletBalances, calcMonthMetrics, previousMonth, type LegWithDirection } from './calculations'

export type InsightKind = 'warning' | 'opportunity' | 'info' | 'celebration'

export type Insight = {
  id: string
  kind: InsightKind
  icon: string
  title: string
  message: string
  emoji?: string
}

type Args = {
  wallets: Wallet[]
  legs: LegWithDirection[]
  transactions: Transaction[]
  loans: Loan[]
  blueHistory: { date: string; value: number }[]
  blueNow: number | null
  totalUsd: number
  prevMilestone?: number | null
}

export function generateInsights(args: Args): Insight[] {
  const { wallets, legs, transactions, loans, blueHistory, blueNow, totalUsd } = args
  const out: Insight[] = []
  const today = new Date()

  // 1. Loan aging
  for (const loan of loans) {
    if (loan.status === 'paid' || loan.status === 'written_off') continue
    const baseDate = new Date(loan.createdAt)
    const days = differenceInDays(today, baseDate)
    if (days > 30) {
      const pending = toNumber(loan.totalAmount) - toNumber(loan.amountPaid)
      out.push({
        id: `loan-${loan.id}`,
        kind: 'warning',
        icon: 'AlertCircle',
        title: 'Préstamo sin cobrar',
        message: `${loan.debtorName} debe USD ${pending.toFixed(0)}. Ya van ${days} días — no te olvides de cobrarle.`,
      })
    }
  }

  // 2. Blue down >5% in 15 days
  if (blueHistory.length >= 2 && blueNow) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 15)
    const past = blueHistory.find((h) => new Date(h.date) <= cutoff) ?? blueHistory[0]
    if (past && past.value > 0) {
      const change = ((blueNow - past.value) / past.value) * 100
      if (change <= -5) {
        out.push({
          id: 'blue-down',
          kind: 'opportunity',
          icon: 'TrendingDown',
          title: 'Blue en baja',
          message: `El blue bajó ${Math.abs(change).toFixed(1)}% esta semana. Buen momento para comprar.`,
        })
      }
    }
  }

  // 3. Expenses > average * 1.3
  {
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const cur = calcMonthMetrics(transactions, y, m)
    let total = 0
    let count = 0
    for (let i = 1; i <= 6; i++) {
      const { year, month } = previousMonth(y, m - i + 1 < 1 ? 12 : m - i + 1)
      const _adj = previousMonth(y, m)
      void _adj
      // simple loop using offset
      const baseDate = new Date(y, m - 1 - i, 1)
      const mm = baseDate.getMonth() + 1
      const yy = baseDate.getFullYear()
      const past = calcMonthMetrics(transactions, yy, mm)
      if (past.expense > 0) {
        total += past.expense
        count++
      }
      void year
      void month
    }
    if (count >= 1 && cur.expense > 0) {
      const avg = total / count
      if (avg > 0 && cur.expense > avg * 1.3) {
        const pct = ((cur.expense - avg) / avg) * 100
        out.push({
          id: 'high-expense',
          kind: 'warning',
          icon: 'AlertTriangle',
          title: 'Gasto alto este mes',
          message: `Este mes gastaron bastante. ${pct.toFixed(0)}% más que el promedio.`,
        })
      }
    }
  }

  // 4. Físicos > 50% del portfolio
  {
    const balances = calcAllWalletBalances(wallets, legs)
    let physTotal = 0
    let portTotal = 0
    for (const w of wallets) {
      const b = balances.get(w.id) ?? 0
      portTotal += b
      if (w.type === 'physical') physTotal += b
    }
    if (portTotal > 0 && physTotal / portTotal > 0.5) {
      const pct = (physTotal / portTotal) * 100
      out.push({
        id: 'too-much-physical',
        kind: 'info',
        icon: 'Banknote',
        title: 'Mucho efectivo en mano',
        message: `El ${pct.toFixed(0)}% del portfolio está en billetes. Sin rendimiento.`,
      })
    }
  }

  // 5. Last cash_out fee > avg fee * 1.1
  {
    const cashOuts = transactions
      .filter((t) => t.type === 'cash_out' && t.feePercentage)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (cashOuts.length >= 2) {
      const last = cashOuts[0]
      const lastFee = toNumber(last.feePercentage)
      const restAvg =
        cashOuts.slice(1).reduce((s, t) => s + toNumber(t.feePercentage), 0) /
        (cashOuts.length - 1)
      if (restAvg > 0 && lastFee > restAvg * 1.1) {
        out.push({
          id: 'high-fee',
          kind: 'info',
          icon: 'Percent',
          title: 'Comisión arriba del promedio',
          message: `La última extracción fue al ${lastFee.toFixed(2)}%. Su promedio es ${restAvg.toFixed(2)}%. Traten de negociar.`,
        })
      }
    }
  }

  // 6. Milestone
  {
    const milestone = Math.floor(totalUsd / 3000) * 3000
    if (milestone >= 3000) {
      out.push({
        id: `milestone-${milestone}`,
        kind: 'celebration',
        icon: 'PartyPopper',
        title: '¡Milestone!',
        message: `¡Llegaron a los USD ${milestone.toLocaleString('es-AR')}! La rompen.`,
        emoji: '🎉',
      })
    }
  }

  // 7. Payday de Flor — Flor cobra el 20 (o día hábil cercano)
  {
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const florIncome = transactions.find((t) => {
      if (t.type !== 'income') return false
      if (t.beneficiary !== 'flor') return false
      const d = new Date(t.date + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() + 1 === m
    })
    if (!florIncome) {
      const status = paydayStatus(today)
      const monthName = today.toLocaleDateString('es-AR', { month: 'long' })
      if (status === 'today') {
        out.push({
          id: 'flor-payday-today',
          kind: 'celebration',
          icon: 'PartyPopper',
          title: '¡Hoy es día de cobro!',
          message: 'Flor cobra el sueldo de este mes. No te olvides de registrarlo.',
          emoji: '💰',
        })
      } else if (status === 'tomorrow') {
        out.push({
          id: 'flor-payday-tomorrow',
          kind: 'info',
          icon: 'Calendar',
          title: 'Mañana cobra Flor',
          message: 'Avisale al asistente cuando lo tengas y lo cargás en 2 taps.',
        })
      } else if (status === 'this-week') {
        out.push({
          id: 'flor-payday-week',
          kind: 'info',
          icon: 'Calendar',
          title: 'Se viene el 20',
          message: 'En estos días Flor cobra. Tené el monto a mano.',
        })
      } else if (status === 'overdue') {
        const daysLate = today.getDate() - 20
        out.push({
          id: 'flor-payday-late',
          kind: 'warning',
          icon: 'AlertTriangle',
          title: 'Sueldo de Flor pendiente',
          message: `Ya van ${daysLate} ${daysLate === 1 ? 'día' : 'días'} del 20 y no registraron el sueldo de ${monthName}. ¿Se olvidaron?`,
        })
      }
    }
  }

  // Cap at 3
  return out.slice(0, 3)
}

/**
 * Determina el estado del payday de Flor (cobra el 20 de cada mes).
 * Si el 20 cae sábado, considera el viernes 19 también como "payday today".
 * Si el 20 cae domingo, considera el lunes 21 también como "payday today".
 */
type PaydayStatus = 'this-week' | 'tomorrow' | 'today' | 'overdue' | 'none'

function paydayStatus(today: Date): PaydayStatus {
  const day = today.getDate()
  const dayOfWeek = today.getDay() // 0=dom, 6=sáb
  const day20 = new Date(today.getFullYear(), today.getMonth(), 20)
  const day20DOW = day20.getDay()

  // Hoy es 20 — es el día estrella siempre
  if (day === 20) return 'today'

  // Si el 20 cae sábado, viernes 19 también cuenta como "today"
  if (day === 19 && day20DOW === 6) return 'today'

  // Si el 20 cae domingo, lunes 21 también cuenta como "today"
  if (day === 21 && day20DOW === 0) return 'today'

  // Mañana es 20
  if (day === 19 && day20DOW !== 6) return 'tomorrow'

  // Esta semana se viene el 20 (días 15-18 si no quedó en otros buckets)
  if (day >= 15 && day <= 18) return 'this-week'

  // Ya pasó el 20 (entre 21-31, salvo el caso del lunes post fin de semana)
  if (day > 20 && !(day === 21 && day20DOW === 0)) return 'overdue'

  return 'none'
}
