'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, transactionLegs, loans, type LoanStatus } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import {
  incomeSchema,
  updateIncomeSchema,
  expenseSchema,
  purchaseSchema,
  transferSchema,
  cashOutSchema,
  loanOutSchema,
  loanInSchema,
  type IncomeInput,
  type UpdateIncomeInput,
  type ExpenseInput,
  type PurchaseInput,
  type TransferInput,
  type CashOutInput,
  type LoanOutInput,
  type LoanInInput,
} from '@/lib/validations/transaction'

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string }

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  return session.user.id
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/transactions')
  revalidatePath('/analysis')
  revalidatePath('/loans')
  revalidatePath('/portfolio')
  revalidatePath('/stats')
}

export async function createIncome(input: IncomeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = incomeSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'income',
          description: data.description?.trim() || (data.beneficiary === 'flor' ? 'Sueldo Flor' : 'Ingreso Fede'),
          amountUsd: data.amountUsd.toFixed(2),
          beneficiary: data.beneficiary,
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values({
        transactionId: created.id,
        walletId: data.walletId,
        direction: 'in',
        amountUsd: data.amountUsd.toFixed(2),
      })
      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function updateIncome(input: UpdateIncomeInput): Promise<ActionResult> {
  try {
    await requireUser()
    const data = updateIncomeSchema.parse(input)

    await db.transaction(async (tx) => {
      const [target] = await tx.select().from(transactions).where(eq(transactions.id, data.id))
      if (!target) throw new Error('Transacción no encontrada')
      if (target.type !== 'income') throw new Error('Solo se pueden editar ingresos')

      await tx
        .update(transactions)
        .set({
          date: data.date,
          description: data.description?.trim() || (data.beneficiary === 'flor' ? 'Sueldo Flor' : 'Ingreso Fede'),
          amountUsd: data.amountUsd.toFixed(2),
          beneficiary: data.beneficiary,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, data.id))

      await tx.delete(transactionLegs).where(eq(transactionLegs.transactionId, data.id))
      await tx.insert(transactionLegs).values({
        transactionId: data.id,
        walletId: data.walletId,
        direction: 'in',
        amountUsd: data.amountUsd.toFixed(2),
      })
    })

    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = expenseSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'expense',
          description: data.description,
          amountUsd: data.totalUsd.toFixed(2),
          category: data.category,
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values(
        data.legs.map((l) => ({
          transactionId: created.id,
          walletId: l.walletId,
          direction: 'out' as const,
          amountUsd: l.amountUsd.toFixed(2),
        })),
      )
      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createPurchase(input: PurchaseInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = purchaseSchema.parse(input)
    const usd = data.amountArs / data.exchangeRate

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'purchase',
          description: `Compra USD a $${data.exchangeRate.toFixed(2)}`,
          amountUsd: usd.toFixed(2),
          amountArs: data.amountArs.toFixed(2),
          exchangeRate: data.exchangeRate.toFixed(4),
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values({
        transactionId: created.id,
        walletId: data.walletId,
        direction: 'in',
        amountUsd: usd.toFixed(2),
      })
      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createTransfer(input: TransferInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = transferSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'transfer',
          description: 'Transferencia entre bolsillos',
          amountUsd: data.amountUsd.toFixed(2),
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values([
        {
          transactionId: created.id,
          walletId: data.fromWalletId,
          direction: 'out',
          amountUsd: data.amountUsd.toFixed(2),
        },
        {
          transactionId: created.id,
          walletId: data.toWalletId,
          direction: 'in',
          amountUsd: data.amountUsd.toFixed(2),
        },
      ])
      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createCashOut(input: CashOutInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = cashOutSchema.parse(input)
    const feeUsd = data.grossAmount * (data.feePercentage / 100)
    const net = data.grossAmount - feeUsd

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'cash_out',
          description: `Extracción a físico (${data.feePercentage.toFixed(2)}% comisión)`,
          amountUsd: net.toFixed(2),
          grossAmount: data.grossAmount.toFixed(2),
          feePercentage: data.feePercentage.toFixed(2),
          feeUsd: feeUsd.toFixed(2),
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values([
        {
          transactionId: created.id,
          walletId: data.fromWalletId,
          direction: 'out',
          amountUsd: data.grossAmount.toFixed(2),
        },
        {
          transactionId: created.id,
          walletId: data.toWalletId,
          direction: 'in',
          amountUsd: net.toFixed(2),
        },
      ])
      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createLoanOut(input: LoanOutInput): Promise<ActionResult<{ id: string; loanId: string }>> {
  try {
    const userId = await requireUser()
    const data = loanOutSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'loan_out',
          description: `Préstamo a ${data.debtorName}`,
          amountUsd: data.totalUsd.toFixed(2),
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values(
        data.legs.map((l) => ({
          transactionId: created.id,
          walletId: l.walletId,
          direction: 'out' as const,
          amountUsd: l.amountUsd.toFixed(2),
        })),
      )

      const [loan] = await tx
        .insert(loans)
        .values({
          transactionId: created.id,
          debtorName: data.debtorName,
          totalAmount: data.totalUsd.toFixed(2),
          amountPaid: '0',
          dueDate: data.dueDate ?? null,
          status: 'active',
          notes: data.notes ?? null,
        })
        .returning({ id: loans.id })

      return { id: created.id, loanId: loan.id }
    })

    revalidateAll()
    return { success: true, data: result }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function createLoanIn(input: LoanInInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUser()
    const data = loanInSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const [loan] = await tx.select().from(loans).where(eq(loans.id, data.loanId))
      if (!loan) throw new Error('Préstamo no encontrado')

      const [created] = await tx
        .insert(transactions)
        .values({
          date: data.date,
          type: 'loan_in',
          description: `Cobro de ${loan.debtorName}`,
          amountUsd: data.totalUsd.toFixed(2),
          groupId: loan.id,
          notes: data.notes ?? null,
          createdBy: userId,
        })
        .returning({ id: transactions.id })

      await tx.insert(transactionLegs).values(
        data.legs.map((l) => ({
          transactionId: created.id,
          walletId: l.walletId,
          direction: 'in' as const,
          amountUsd: l.amountUsd.toFixed(2),
        })),
      )

      const newPaid = parseFloat(loan.amountPaid) + data.totalUsd
      const total = parseFloat(loan.totalAmount)
      let status: LoanStatus
      if (newPaid >= total - 0.01) status = 'paid'
      else if (newPaid > 0) status = 'partially_paid'
      else status = 'active'

      await tx
        .update(loans)
        .set({
          amountPaid: newPaid.toFixed(2),
          status,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loan.id))

      return created
    })

    revalidateAll()
    return { success: true, data: { id: result.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    await requireUser()
    await db.transaction(async (tx) => {
      const [target] = await tx.select().from(transactions).where(eq(transactions.id, id))
      if (!target) throw new Error('Transacción no encontrada')

      // If it's a loan_in, reverse the loan totals
      if (target.type === 'loan_in' && target.groupId) {
        const [loan] = await tx.select().from(loans).where(eq(loans.id, target.groupId))
        if (loan) {
          const newPaid = Math.max(0, parseFloat(loan.amountPaid) - parseFloat(target.amountUsd))
          const total = parseFloat(loan.totalAmount)
          let status: LoanStatus
          if (newPaid >= total - 0.01) status = 'paid'
          else if (newPaid > 0) status = 'partially_paid'
          else status = 'active'
          await tx
            .update(loans)
            .set({ amountPaid: newPaid.toFixed(2), status, updatedAt: new Date() })
            .where(eq(loans.id, loan.id))
        }
      }

      // If it's a loan_out, delete the linked loan if it has no payments
      if (target.type === 'loan_out') {
        const [linked] = await tx.select().from(loans).where(eq(loans.transactionId, target.id))
        if (linked && parseFloat(linked.amountPaid) === 0) {
          await tx.delete(loans).where(eq(loans.id, linked.id))
        }
      }

      await tx.delete(transactions).where(eq(transactions.id, id))
    })
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
