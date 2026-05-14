import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const usdFmt = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const arsFmt = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const arsDecimalFmt = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const rateFmt = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pctFmt = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatUSD(value: number | string | null | undefined, opts: { sign?: boolean } = {}) {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (Number.isNaN(n)) return '0,00'
  const formatted = usdFmt.format(Math.abs(n))
  if (opts.sign) {
    if (n > 0) return `+${formatted}`
    if (n < 0) return `−${formatted}`
  }
  return n < 0 ? `−${formatted}` : formatted
}

export function formatARS(value: number | string | null | undefined, opts: { decimals?: boolean } = {}) {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (Number.isNaN(n)) return '$ 0'
  const fmt = opts.decimals ? arsDecimalFmt : arsFmt
  return `$ ${fmt.format(n)}`
}

export function formatRate(value: number | string | null | undefined) {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (Number.isNaN(n)) return '$ 0,00'
  return `$ ${rateFmt.format(n)}`
}

export function formatPct(value: number | null | undefined, opts: { sign?: boolean } = {}) {
  const n = value ?? 0
  if (Number.isNaN(n)) return '0,0%'
  const formatted = pctFmt.format(Math.abs(n))
  if (opts.sign) {
    if (n > 0) return `+${formatted}%`
    if (n < 0) return `−${formatted}%`
  }
  return `${n < 0 ? '−' : ''}${formatted}%`
}

export function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? parseISO(value) : value
  return format(d, "EEEE d 'de' LLLL", { locale: es })
}

export function formatDateShort(value: string | Date) {
  const d = typeof value === 'string' ? parseISO(value) : value
  return format(d, "d 'de' LLL", { locale: es })
}

export function formatMonthYear(year: number, month: number) {
  const d = new Date(year, month - 1, 1)
  return format(d, "LLLL yyyy", { locale: es })
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : 0
}
