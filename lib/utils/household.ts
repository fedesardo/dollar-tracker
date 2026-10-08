export const HOUSEHOLD_GROUPS = [
  { id: 'casa', label: 'Casa' },
  { id: 'auto', label: 'Autos' },
  { id: 'plataformas', label: 'Plataformas y suscripciones' },
  { id: 'clubes', label: 'Clubes' },
  { id: 'otros', label: 'Otros' },
] as const

export type HouseholdGroupId = (typeof HOUSEHOLD_GROUPS)[number]['id']

export const FREQUENCY_OPTIONS = [
  { months: 1, label: 'Todos los meses' },
  { months: 2, label: 'Cada 2 meses' },
  { months: 3, label: 'Cada 3 meses' },
  { months: 4, label: 'Cada 4 meses' },
  { months: 6, label: 'Cada 6 meses' },
  { months: 12, label: 'Una vez por año' },
] as const

export type AmountPoint = { effectiveFrom: string; amount: number }

/** 'YYYY-MM' del mes de una fecha. */
export function monthOf(date: Date) {
  return date.toISOString().slice(0, 7)
}

/** Suma (o resta) meses a un 'YYYY-MM'. */
export function addMonths(month: string, n: number) {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year, m - 1 + n, 1)).toISOString().slice(0, 7)
}

/** Monto vigente en `month` ('YYYY-MM'): el último cuyo mes de inicio ya llegó. */
export function currentAmount(points: AmountPoint[], month: string): AmountPoint | null {
  let best: AmountPoint | null = null
  for (const point of points) {
    if (point.effectiveFrom.slice(0, 7) > month) continue
    if (!best || point.effectiveFrom > best.effectiveFrom) best = point
  }
  return best
}

export type StructureInput = {
  id: string
  currency: 'ARS' | 'USD'
  monthsPerCharge: number
  /** Monto de cada cobro; null si todavía no se cargó. */
  amount: number | null
}

/** Cuánto pesa por mes un concepto, en su moneda (lo anual se prorratea). */
export function monthlyEquivalent(amount: number, monthsPerCharge: number) {
  return amount / Math.max(1, monthsPerCharge)
}

export function toArs(value: number, currency: 'ARS' | 'USD', usdRate: number) {
  return currency === 'USD' ? value * usdRate : value
}

/**
 * Total mensual aproximado en pesos. `overrides` permite simular: id → nuevo
 * monto de cada cobro (0 = darse de baja).
 */
export function calculateStructure(
  items: StructureInput[],
  usdRate: number,
  overrides: Record<string, number> = {},
) {
  let totalArs = 0
  let missing = 0
  for (const item of items) {
    const amount = item.id in overrides ? overrides[item.id] : item.amount
    if (amount === null) {
      missing += 1
      continue
    }
    totalArs += toArs(monthlyEquivalent(amount, item.monthsPerCharge), item.currency, usdRate)
  }
  return { totalArs, totalUsd: usdRate > 0 ? totalArs / usdRate : 0, missing }
}

/** Redondeo para mostrar números "aproximados". */
export const roundToThousand = (n: number) => Math.round(n / 1000) * 1000
