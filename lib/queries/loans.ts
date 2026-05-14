import 'server-only'
import { db } from '@/lib/db'
import { loans, transactions, transactionLegs, type Loan, type TransactionLeg } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'

export type LoanWithLegs = Loan & {
  originLegs: TransactionLeg[]
  paymentLegs: { txId: string; date: string; legs: TransactionLeg[] }[]
}

export async function getAllLoans(): Promise<Loan[]> {
  return db.select().from(loans).orderBy(desc(loans.createdAt))
}

export async function getLoansWithDetails(): Promise<LoanWithLegs[]> {
  const allLoans = await db.select().from(loans).orderBy(desc(loans.createdAt))
  if (allLoans.length === 0) return []

  // Fetch related transactions: loan_out and loan_in
  const loanTxIds = allLoans.map((l) => l.transactionId).filter((id): id is string => !!id)
  const originLegsByTx = new Map<string, TransactionLeg[]>()
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
    const paymentTxs = cobrosByLoan.get(loan.id) ?? []
    return {
      ...loan,
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
