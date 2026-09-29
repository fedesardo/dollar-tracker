import type { CarLoan, CarLoanInstallment } from '@/lib/db/schema'

const round2 = (n: number) => Math.round(n * 100) / 100

/** Cuota fija del sistema francés (capital + interés, sin seguro). */
export function frenchInstallment(principal: number, tnaPct: number, n: number) {
  const r = tnaPct / 100 / 12
  if (r === 0) return round2(principal / n)
  return round2((principal * r) / (1 - Math.pow(1 + r, -n)))
}

export type AmortizationRow = {
  number: number
  interest: number
  principalPart: number
  balance: number
}

/** Cuadro de amortización pura del crédito (sin seguro). */
export function buildAmortization(
  principal: number,
  tnaPct: number,
  n: number,
  installment: number,
): AmortizationRow[] {
  const r = tnaPct / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = principal
  for (let number = 1; number <= n; number++) {
    const interest = balance * r
    // La última cuota cierra el saldo exacto.
    const principalPart = number === n ? balance : installment - interest
    balance = Math.max(0, balance - principalPart)
    rows.push({ number, interest, principalPart, balance })
  }
  return rows
}

export type CarLoanInstallmentView = {
  id: string
  number: number
  dueOn: string
  expectedTotal: number
  paidAmount: number | null
  paidOn: string | null
  isPaid: boolean
  /** Seguro real si está pagada; estimado (esperada − crédito) si no. */
  insurance: number
  amortization: AmortizationRow
}

export function calculateCarLoanMetrics(
  loan: CarLoan,
  installments: CarLoanInstallment[],
  asOf: string,
) {
  const fixed = Number(loan.creditInstallmentArs)
  const schedule = buildAmortization(
    Number(loan.principalArs),
    Number(loan.tnaPct),
    loan.totalInstallments,
    fixed,
  )

  const rows: CarLoanInstallmentView[] = [...installments]
    .sort((a, b) => a.number - b.number)
    .map((i) => {
      const isPaid = i.paidAmountArs !== null
      const paidAmount = isPaid ? Number(i.paidAmountArs) : null
      const expectedTotal = Number(i.expectedTotalArs)
      return {
        id: i.id,
        number: i.number,
        dueOn: i.dueOn,
        expectedTotal,
        paidAmount,
        paidOn: i.paidOn,
        isPaid,
        insurance: round2((paidAmount ?? expectedTotal) - fixed),
        amortization: schedule[i.number - 1],
      }
    })

  const paid = rows.filter((r) => r.isPaid)
  const pending = rows.filter((r) => !r.isPaid)
  const lastPaidNumber = paid.reduce((max, r) => Math.max(max, r.number), 0)
  const outstandingCapital =
    lastPaidNumber === 0
      ? Number(loan.principalArs)
      : schedule[lastPaidNumber - 1].balance

  return {
    fixedInstallment: fixed,
    rows,
    paidCount: paid.length,
    totalCount: loan.totalInstallments,
    totalPaid: paid.reduce((s, r) => s + (r.paidAmount ?? 0), 0),
    insurancePaid: paid.reduce((s, r) => s + r.insurance, 0),
    creditPaid: paid.length * fixed,
    outstandingCapital,
    remainingProjected: pending.reduce((s, r) => s + r.expectedTotal, 0),
    remainingInsuranceProjected: pending.reduce((s, r) => s + r.insurance, 0),
    next: pending[0] ?? null,
    overdue: pending.filter((r) => r.dueOn < asOf),
  }
}
