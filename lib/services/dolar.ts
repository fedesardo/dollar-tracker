import 'server-only'

export type DolarSnapshot = {
  blue: { compra: number; venta: number } | null
  oficial: { compra: number; venta: number } | null
  mep: { compra: number; venta: number } | null
  ccl: { compra: number; venta: number } | null
}

async function fetchOne(slug: string) {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { compra: number; venta: number }
    return { compra: data.compra, venta: data.venta }
  } catch {
    return null
  }
}

export async function getCurrentRates(): Promise<DolarSnapshot> {
  const [blue, oficial, mep, ccl] = await Promise.all([
    fetchOne('blue'),
    fetchOne('oficial'),
    fetchOne('mep'),
    fetchOne('contadoconliqui'),
  ])
  return { blue, oficial, mep, ccl }
}

export type BlueHistoryPoint = { date: string; value: number }

/**
 * Pulls historical blue mid-price from dolarapi (last ~365 days).
 * Returns daily entries sorted ascending by date.
 */
export async function getBlueHistory(days = 365): Promise<BlueHistoryPoint[]> {
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares/blue', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    type Row = { fecha: string; compra: number; venta: number }
    const data = (await res.json()) as Row[]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return data
      .filter((r) => new Date(r.fecha) >= cutoff)
      .map((r) => ({
        date: r.fecha,
        value: (r.compra + r.venta) / 2,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

/**
 * Returns end-of-month blue close (last available value for each month) for the last `months` months.
 */
export async function getMonthlyBlueClose(months = 12): Promise<{ year: number; month: number; value: number }[]> {
  const history = await getBlueHistory(months * 31 + 31)
  const byMonth = new Map<string, BlueHistoryPoint>()
  for (const point of history) {
    const d = new Date(point.date)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    const existing = byMonth.get(key)
    if (!existing || point.date > existing.date) byMonth.set(key, point)
  }
  return Array.from(byMonth.entries()).map(([key, p]) => {
    const [y, m] = key.split('-').map(Number)
    return { year: y, month: m, value: p.value }
  })
}
