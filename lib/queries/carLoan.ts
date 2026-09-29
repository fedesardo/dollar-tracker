import 'server-only'

import { db } from '@/lib/db'
import { carLoanInstallments } from '@/lib/db/schema'
import { calculateCarLoanMetrics } from '@/lib/utils/carLoan'
import { ensureCarLoanInitialData } from '@/lib/services/carLoanBootstrap'
import { asc, eq } from 'drizzle-orm'

export async function getCarLoanDashboard() {
  const loan = await ensureCarLoanInitialData()
  const installments = await db
    .select()
    .from(carLoanInstallments)
    .where(eq(carLoanInstallments.loanId, loan.id))
    .orderBy(asc(carLoanInstallments.number))

  const asOf = new Date().toISOString().slice(0, 10)
  const metrics = calculateCarLoanMetrics(loan, installments, asOf)
  return { loan, metrics, asOf }
}
