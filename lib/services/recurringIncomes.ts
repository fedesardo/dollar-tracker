import 'server-only'
import { db } from '@/lib/db'
import {
  recurringIncomes,
  transactions,
  transactionLegs,
  users,
  type RecurringIncome,
} from '@/lib/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'

function effectiveDay(dayOfMonth: number, ref: Date): number {
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  return Math.min(dayOfMonth, lastDay)
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthBounds(ref: Date): { start: string; nextStart: string } {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
  const nextStart = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
  return { start: isoDate(start), nextStart: isoDate(nextStart) }
}

async function runOne(
  rule: RecurringIncome,
  today: Date,
  userId: string,
): Promise<boolean> {
  const day = today.getDate()
  if (day < effectiveDay(rule.dayOfMonth, today)) return false

  const { start, nextStart } = monthBounds(today)
  if (rule.lastRunOn && rule.lastRunOn >= start && rule.lastRunOn < nextStart) {
    return false
  }

  // Idempotencia: no crear si ya hay una tx tipo 'income' para este beneficiary este mes.
  // Cubre tanto auto-creadas (mismo rule.id) como manuales que el user registró antes del día configurado.
  const existing = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'income'),
        eq(transactions.beneficiary, rule.beneficiary),
        gte(transactions.date, start),
        lt(transactions.date, nextStart),
      ),
    )
    .limit(1)
  if (existing.length > 0) {
    await db
      .update(recurringIncomes)
      .set({ lastRunOn: isoDate(today), updatedAt: new Date() })
      .where(eq(recurringIncomes.id, rule.id))
    return false
  }

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(transactions)
      .values({
        date: isoDate(today),
        type: 'income',
        description: rule.description,
        amountUsd: rule.amountUsd,
        beneficiary: rule.beneficiary,
        notes: rule.notes ?? null,
        recurringIncomeId: rule.id,
        createdBy: userId,
      })
      .returning({ id: transactions.id })

    await tx.insert(transactionLegs).values({
      transactionId: created.id,
      walletId: rule.walletId,
      direction: 'in',
      amountUsd: rule.amountUsd,
    })

    await tx
      .update(recurringIncomes)
      .set({ lastRunOn: isoDate(today), updatedAt: new Date() })
      .where(eq(recurringIncomes.id, rule.id))
  })

  return true
}

export async function runDueRecurringIncomes(now: Date = new Date()): Promise<{
  ran: number
  skipped: number
}> {
  const [anyUser] = await db.select({ id: users.id }).from(users).limit(1)
  if (!anyUser) return { ran: 0, skipped: 0 }

  const rules = await db
    .select()
    .from(recurringIncomes)
    .where(eq(recurringIncomes.isActive, true))

  let ran = 0
  let skipped = 0
  for (const rule of rules) {
    try {
      const created = await runOne(rule, now, anyUser.id)
      if (created) ran++
      else skipped++
    } catch (err) {
      console.error(`[recurring-incomes] rule ${rule.id} failed`, err)
      skipped++
    }
  }
  return { ran, skipped }
}
