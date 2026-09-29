import 'server-only'

import { db } from '@/lib/db'
import { carLoanInstallments, carLoans } from '@/lib/db/schema'
import { frenchInstallment } from '@/lib/utils/carLoan'
import { eq } from 'drizzle-orm'

export const CAR_LOAN_SLUG = 'prestamo-byd'

const PRINCIPAL = 10_000_000
const TNA = 19.9
const INSTALLMENTS = 18

// Cuotas 2 a 18 tal como las informa el banco (crédito + seguro estimado).
const BANK_EXPECTED = [
  819290.7, 817586.71, 815854.47, 675102.73, 673312.56, 671492.71, 669642.67,
  667761.95, 665850.05, 663906.44, 661930.59, 659921.99, 657880.07, 655804.29,
  653694.09, 651548.89, 649368.1,
]
const FIRST_PAID_AMOUNT = 820966.9
const FIRST_PAID_ON = '2026-09-28'

/** Vencimiento el 28 de cada mes, arrancando el 28-sep-2026 (cuota 1). */
function dueDate(number: number) {
  const monthIndex = 8 + (number - 1) // septiembre = 8
  const year = 2026 + Math.floor(monthIndex / 12)
  const month = (monthIndex % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}-28`
}

/** Alta única e idempotente del préstamo BYD con sus 18 cuotas. */
export async function ensureCarLoanInitialData() {
  await db
    .insert(carLoans)
    .values({
      slug: CAR_LOAN_SLUG,
      name: 'Préstamo BYD',
      lender: 'ICBC',
      principalArs: PRINCIPAL.toFixed(2),
      tnaPct: TNA.toFixed(3),
      totalInstallments: INSTALLMENTS,
      creditInstallmentArs: frenchInstallment(PRINCIPAL, TNA, INSTALLMENTS).toFixed(2),
    })
    .onConflictDoNothing({ target: carLoans.slug })

  const [loan] = await db
    .select()
    .from(carLoans)
    .where(eq(carLoans.slug, CAR_LOAN_SLUG))
    .limit(1)
  if (!loan) throw new Error('No se pudo inicializar el préstamo BYD')

  await db
    .insert(carLoanInstallments)
    .values(
      Array.from({ length: INSTALLMENTS }, (_, index) => {
        const number = index + 1
        const paid = number === 1
        const expected = paid ? FIRST_PAID_AMOUNT : BANK_EXPECTED[index - 1]
        return {
          loanId: loan.id,
          number,
          dueOn: dueDate(number),
          expectedTotalArs: expected.toFixed(2),
          paidAmountArs: paid ? FIRST_PAID_AMOUNT.toFixed(2) : null,
          paidOn: paid ? FIRST_PAID_ON : null,
        }
      }),
    )
    .onConflictDoNothing()

  return loan
}
