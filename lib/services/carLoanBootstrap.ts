import 'server-only'

import { db } from '@/lib/db'
import { carLoanInstallments, carLoans } from '@/lib/db/schema'
import { frenchInstallment } from '@/lib/utils/carLoan'
import { and, eq } from 'drizzle-orm'

export const CAR_LOAN_SLUG = 'prestamo-byd'

const PRINCIPAL = 10_000_000
const TNA = 19.9
const INSTALLMENTS = 18

// Total de cada cuota tal como lo informa el banco (crédito + IVA + seguro).
// La 1 es lo que ya se pagó; de la 2 a la 18 es lo proyectado.
const BANK_LISTED = [
  820966.9, 819290.7, 817586.71, 815854.47, 675102.73, 673312.56, 671492.71,
  669642.67, 667761.95, 665850.05, 663906.44, 661930.59, 659921.99, 657880.07,
  655804.29, 653694.09, 651548.89, 649368.1,
]
// El banco proyecta seguro sólo en las cuotas 1 a 4 (constante). Desde la 5
// lo que sobra sobre la cuota fija es únicamente IVA (21%) sobre el interés.
const INSURANCE_UNTIL = 4
const INSURANCE_LISTED = 138990.5
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

  const fixed = Number(loan.creditInstallmentArs)
  const rows = Array.from({ length: INSTALLMENTS }, (_, index) => {
    const number = index + 1
    const listed = BANK_LISTED[index]
    const insurance = number <= INSURANCE_UNTIL ? INSURANCE_LISTED : 0
    const paid = number === 1
    return {
      loanId: loan.id,
      number,
      dueOn: dueDate(number),
      bankListedTotalArs: listed.toFixed(2),
      vatArs: (listed - fixed - insurance).toFixed(2),
      expectedTotalArs: listed.toFixed(2),
      paidAmountArs: paid ? listed.toFixed(2) : null,
      paidOn: paid ? FIRST_PAID_ON : null,
    }
  })

  await db.insert(carLoanInstallments).values(rows).onConflictDoNothing()

  // Filas cargadas antes de existir el snapshot del banco y el IVA.
  for (const row of rows) {
    await db
      .update(carLoanInstallments)
      .set({ bankListedTotalArs: row.bankListedTotalArs, vatArs: row.vatArs })
      .where(
        and(
          eq(carLoanInstallments.loanId, loan.id),
          eq(carLoanInstallments.number, row.number),
          eq(carLoanInstallments.bankListedTotalArs, '0.00'),
        ),
      )
  }

  return loan
}
