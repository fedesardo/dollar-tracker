import 'server-only'

import { db } from '@/lib/db'
import { householdItemAmounts, householdItems } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

type Seed = {
  slug: string
  name: string
  group: string
  currency?: 'ARS' | 'USD'
  months?: number
  /** Monto base; null = todavía falta cargarlo. */
  amount: number | null
  source?: 'car_loan'
  notes?: string
}

// Catálogo inicial armado con la planilla y el resumen de la Visa (sep-2026).
// Los montos en null los carga Fede desde la pantalla.
const SEEDS: Seed[] = [
  { slug: 'expensas', name: 'Expensas', group: 'casa', amount: null },
  { slug: 'agua', name: 'Agua (coop. Río Ceballos)', group: 'casa', amount: null },
  { slug: 'gas', name: 'Gas (Ecogas)', group: 'casa', amount: null },
  { slug: 'epec', name: 'Epec (luz)', group: 'casa', amount: null },
  { slug: 'internet', name: 'Internet (Artecom)', group: 'casa', amount: null },
  { slug: 'municipalidad', name: 'Municipalidad', group: 'casa', amount: null, notes: 'Falta confirmar frecuencia y si es fijo o variable.' },
  { slug: 'rentas-cordoba', name: 'Rentas Córdoba', group: 'casa', amount: null, notes: 'Falta confirmar frecuencia y si es fijo o variable.' },
  { slug: 'celu-fede', name: 'Celu Fede', group: 'casa', amount: null },
  { slug: 'celu-flor', name: 'Celu Flor (Tuenti)', group: 'casa', amount: null },

  {
    slug: 'cuota-byd',
    name: 'Cuota BYD',
    group: 'auto',
    amount: null,
    source: 'car_loan',
    notes: 'Sale del Préstamo BYD: crédito + IVA de la próxima cuota.',
  },
  {
    slug: 'seguro-byd',
    name: 'Seguro BYD',
    group: 'auto',
    amount: 138990.77,
    notes: 'Mapfre hasta el 28/12/2026. Después, a definir.',
  },
  { slug: 'rentas-byd', name: 'Rentas BYD (Córdoba)', group: 'auto', amount: null, notes: 'Falta confirmar frecuencia y si es fijo o variable.' },
  { slug: 'municipal-byd', name: 'Municipal BYD (Córdoba)', group: 'auto', amount: null, notes: 'Falta confirmar frecuencia y si es fijo o variable.' },
  { slug: 'seguro-fiesta', name: 'Seguro Fiesta', group: 'auto', amount: 122262.48 },
  {
    slug: 'rentas-san-luis',
    name: 'Rentas San Luis (patente Fiesta)',
    group: 'auto',
    amount: null,
    notes: 'Falta confirmar frecuencia y si es fijo o variable.',
  },

  { slug: 'chatgpt', name: 'ChatGPT', group: 'plataformas', currency: 'USD', amount: 100 },
  {
    slug: 'apple',
    name: 'Apple (3 suscripciones)',
    group: 'plataformas',
    currency: 'USD',
    amount: 17.47,
    notes: 'Cobros de US$ 4,99 + 9,49 + 2,99. Falta identificar cuáles son.',
  },
  {
    slug: 'apple-anual',
    name: 'Apple (anual)',
    group: 'plataformas',
    currency: 'USD',
    months: 12,
    amount: 99,
  },
  { slug: 'sportmonks', name: 'Sportmonks', group: 'plataformas', currency: 'USD', amount: 34.04 },
  { slug: 'netflix', name: 'Netflix', group: 'plataformas', currency: 'USD', amount: 13.62 },
  { slug: 'cloudflare', name: 'Cloudflare', group: 'plataformas', currency: 'USD', amount: 10.46 },
  {
    slug: 'github',
    name: 'GitHub',
    group: 'plataformas',
    currency: 'USD',
    amount: 7.05,
    notes: 'Dos cobros (US$ 3,05 y 4,00). Falta revisar por qué.',
  },
  { slug: 'medium', name: 'Medium', group: 'plataformas', currency: 'USD', amount: 5, notes: 'Candidato a baja.' },
  { slug: 'spotify', name: 'Spotify', group: 'plataformas', currency: 'USD', amount: 3.69 },
  { slug: 'linkedin', name: 'LinkedIn', group: 'plataformas', currency: 'USD', amount: 1.2 },
  { slug: 'canva', name: 'Canva', group: 'plataformas', amount: 12589.66 },
  {
    slug: 'mercado-pago',
    name: 'Mercado Pago Nivel 6',
    group: 'plataformas',
    amount: 20990,
    notes: 'A confirmar: sale como "Merpago*meli".',
  },

  { slug: 'river', name: 'Socio Simple River', group: 'clubes', amount: 35430 },
  { slug: 'bon-vivir', name: 'Club Bon Vivir (vinos)', group: 'clubes', amount: 68660 },
]

/** Alta única e idempotente del catálogo inicial. */
export async function ensureHouseholdInitialData() {
  const slugs = SEEDS.map((seed) => seed.slug)
  const existing = await db
    .select({ slug: householdItems.slug })
    .from(householdItems)
    .where(inArray(householdItems.slug, slugs))
  const have = new Set(existing.map((row) => row.slug))
  const missing = SEEDS.filter((seed) => !have.has(seed.slug))
  if (missing.length === 0) return

  const inserted = await db
    .insert(householdItems)
    .values(
      missing.map((seed) => ({
        slug: seed.slug,
        name: seed.name,
        groupKey: seed.group,
        currency: seed.currency ?? 'ARS',
        monthsPerCharge: seed.months ?? 1,
        source: seed.source ?? null,
        notes: seed.notes ?? null,
        sortOrder: SEEDS.indexOf(seed),
      })),
    )
    .onConflictDoNothing()
    .returning({ id: householdItems.id, slug: householdItems.slug })

  const amountBySlug = new Map(SEEDS.map((seed) => [seed.slug, seed.amount]))
  const amounts = inserted.flatMap((row) => {
    const amount = amountBySlug.get(row.slug ?? '')
    return amount === null || amount === undefined
      ? []
      : [{ itemId: row.id, effectiveFrom: '2026-10-01', amount: amount.toFixed(2) }]
  })
  if (amounts.length > 0) {
    await db.insert(householdItemAmounts).values(amounts).onConflictDoNothing()
  }
}
