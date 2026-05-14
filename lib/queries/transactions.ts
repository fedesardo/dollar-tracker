import 'server-only'
import { db } from '@/lib/db'
import { transactions, transactionLegs, type Transaction, type TransactionLeg } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'

export type TransactionWithLegs = Transaction & { legs: TransactionLeg[] }

export async function getAllTransactionsWithLegs(): Promise<TransactionWithLegs[]> {
  const txs = await db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.createdAt))
  if (txs.length === 0) return []
  const legs = await db
    .select()
    .from(transactionLegs)
    .where(inArray(transactionLegs.transactionId, txs.map((t) => t.id)))
  const grouped = new Map<string, TransactionLeg[]>()
  for (const l of legs) {
    const arr = grouped.get(l.transactionId) ?? []
    arr.push(l)
    grouped.set(l.transactionId, arr)
  }
  return txs.map((t) => ({ ...t, legs: grouped.get(t.id) ?? [] }))
}

export async function getAllLegs(): Promise<TransactionLeg[]> {
  return db.select().from(transactionLegs)
}

export async function getTransactionWithLegs(id: string): Promise<TransactionWithLegs | null> {
  const tx = await db.select().from(transactions).where(eq(transactions.id, id))
  if (tx.length === 0) return null
  const legs = await db
    .select()
    .from(transactionLegs)
    .where(eq(transactionLegs.transactionId, id))
  return { ...tx[0], legs }
}
