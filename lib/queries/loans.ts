import 'server-only'
import { db } from '@/lib/db'
import { loans, transactions, transactionLegs, type Loan, type TransactionLeg } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'

export type LoanWithDate = Loan & { originDate: string | null }

export type LoanWithLegs = LoanWithDate & {
  originLegs: TransactionLeg[]
  paymentLegs: { txId: string; date: string; legs: TransactionLeg[] }[]
}

/**
 * Devuelve loans con la fecha de su transacción origen (loan_out).
 * Si el loan no tiene transactionId (legacy), originDate queda null y se cae a createdAt.
 */
export async function getAllLoans(): Promise<LoanWithDate[]> {
  const allLoans = await db.select().from(loans).orderBy(desc(loans.createdAt))
  if (allLoans.length === 0) return []
  const txIds = allLoans.map((l) => l.transactionId).filter((id): id is string => !!id)
  const dateByTx = new Map<string, string>()
  if (txIds.length > 0) {
    const txs = await db
      .select({ id: transactions.id, date: transactions.date })
      .from(transactions)
      .where(inArray(transactions.id, txIds))
    for (const t of txs) dateByTx.set(t.id, t.date)
  }
  return allLoans.map((l) => ({
    ...l,
    originDate: l.transactionId ? dateByTx.get(l.transactionId) ?? null : null,
  }))
}

export async function getLoansWithDetails(): Promise<LoanWithLegs[]> {
  const allLoans = await db.select().from(loans).orderBy(desc(loans.createdAt))
  if (allLoans.length === 0) return []

  // Fetch related transactions: loan_out and loan_in
  const loanTxIds = allLoans.map((l) => l.transactionId).filter((id): id is string => !!id)
  const originLegsByTx = new Map<string, TransactionLeg[]>()
  const originDateByTx = new Map<string, string>()
  if (loanTxIds.length > 0) {
    const originLegs = await db
      .select()
      .from(transactionLegs)
      .where(inArray(transactionLegs.transactionId, loanTxIds))
    for (const l of originLegs) {
      const arr = originLegsByTx.get(l.transactionId) ?? []
      arr.push(l)
      originLegsByTx.set(l.transactionId, arr)
    }
    const originTxs = await db
      .select({ id: transactions.id, date: transactions.date })
      .from(transactions)
      .where(inArray(transactions.id, loanTxIds))
    for (const t of originTxs) originDateByTx.set(t.id, t.date)
  }

  // For loan_in payments, we use groupId on transactions to link cobros to loanId via notes / groupId? Easier: use groupId == loanId for loan_in.
  const loanIds = allLoans.map((l) => l.id)
  const cobros = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.groupId, loanIds))
    .orderBy(desc(transactions.date))

  const cobroIds = cobros.map((c) => c.id)
  const cobroLegs = cobroIds.length > 0
    ? await db.select().from(transactionLegs).where(inArray(transactionLegs.transactionId, cobroIds))
    : []
  const legsByTx = new Map<string, TransactionLeg[]>()
  for (const l of cobroLegs) {
    const arr = legsByTx.get(l.transactionId) ?? []
    arr.push(l)
    legsByTx.set(l.transactionId, arr)
  }
  const cobrosByLoan = new Map<string, typeof cobros>()
  for (const c of cobros) {
    if (!c.groupId) continue
    const arr = cobrosByLoan.get(c.groupId) ?? []
    arr.push(c)
    cobrosByLoan.set(c.groupId, arr)
  }

  return allLoans.map((loan) => {
    const originLegs = loan.transactionId ? originLegsByTx.get(loan.transactionId) ?? [] : []
    const originDate = loan.transactionId ? originDateByTx.get(loan.transactionId) ?? null : null
    const paymentTxs = cobrosByLoan.get(loan.id) ?? []
    return {
      ...loan,
      originDate,
      originLegs,
      paymentLegs: paymentTxs.map((t) => ({
        txId: t.id,
        date: t.date,
        legs: legsByTx.get(t.id) ?? [],
      })),
    }
  })
}

export async function getActiveLoans(): Promise<Loan[]> {
  return db
    .select()
    .from(loans)
    .where(inArray(loans.status, ['active', 'partially_paid']))
    .orderBy(desc(loans.createdAt))
}
