'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { carLoanInstallments, carLoans } from '@/lib/db/schema'
import {
  carLoanExpectedSchema,
  carLoanInsuranceSchema,
  carLoanPaymentSchema,
  type CarLoanExpectedInput,
  type CarLoanInsuranceInput,
  type CarLoanPaymentInput,
} from '@/lib/validations/carLoan'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
}

const revalidateAll = () => revalidatePath('/car-loan')
const fail = (error: unknown, fallback: string): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : fallback,
})

export async function payCarLoanInstallment(
  input: CarLoanPaymentInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = carLoanPaymentSchema.parse(input)
    const updated = await db
      .update(carLoanInstallments)
      .set({
        paidAmountArs: data.paidAmountArs.toFixed(2),
        paidOn: data.paidOn,
        updatedAt: new Date(),
      })
      .where(eq(carLoanInstallments.id, data.installmentId))
      .returning({ id: carLoanInstallments.id })
    if (updated.length === 0) throw new Error('Cuota no encontrada')
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo registrar el pago')
  }
}

export async function undoCarLoanPayment(installmentId: string): Promise<ActionResult> {
  try {
    await requireUser()
    await db
      .update(carLoanInstallments)
      .set({ paidAmountArs: null, paidOn: null, updatedAt: new Date() })
      .where(eq(carLoanInstallments.id, installmentId))
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo deshacer el pago')
  }
}

export async function updateCarLoanExpected(
  input: CarLoanExpectedInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = carLoanExpectedSchema.parse(input)
    await db
      .update(carLoanInstallments)
      .set({
        expectedTotalArs: data.expectedTotalArs.toFixed(2),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(carLoanInstallments.id, data.installmentId),
          isNull(carLoanInstallments.paidAmountArs),
        ),
      )
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo actualizar la cuota')
  }
}

/** Fija el seguro estimado de todas las cuotas impagas desde la N en adelante. */
export async function setCarLoanInsuranceFrom(
  input: CarLoanInsuranceInput,
): Promise<ActionResult> {
  try {
    await requireUser()
    const data = carLoanInsuranceSchema.parse(input)
    await db.transaction(async (tx) => {
      const [loan] = await tx.select().from(carLoans).limit(1)
      if (!loan) throw new Error('Préstamo no encontrado')
      const expected = (
        Number(loan.creditInstallmentArs) + data.insuranceArs
      ).toFixed(2)
      await tx
        .update(carLoanInstallments)
        .set({ expectedTotalArs: expected, updatedAt: new Date() })
        .where(
          and(
            eq(carLoanInstallments.loanId, loan.id),
            gte(carLoanInstallments.number, data.fromNumber),
            isNull(carLoanInstallments.paidAmountArs),
          ),
        )
    })
    revalidateAll()
    return { success: true }
  } catch (error) {
    return fail(error, 'No se pudo actualizar el seguro')
  }
}
