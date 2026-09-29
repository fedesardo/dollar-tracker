export type CoverageStatus = 'yes' | 'partial' | 'no' | 'unknown'
export type CoverageValue = { status: CoverageStatus; detail: string }
export type CoverageMap = Record<string, CoverageValue>

export const COVERAGE_STATUS_LABEL: Record<CoverageStatus, string> = {
  yes: 'Sí',
  partial: 'Con condiciones',
  no: 'No',
  unknown: 'Preguntar',
}

export const COVERAGE_STATUSES = Object.keys(COVERAGE_STATUS_LABEL) as CoverageStatus[]

export const COVERAGE_CATEGORIES = [
  { id: 'third', label: 'A terceros' },
  { id: 'damage', label: 'Choques y daños al auto' },
  { id: 'theft', label: 'Robo e incendio' },
  { id: 'glass', label: 'Cristales y cerraduras' },
  { id: 'weather', label: 'Clima y catástrofes' },
  { id: 'assist', label: 'Asistencia y servicios' },
  { id: 'people', label: 'Personas y viajes' },
  { id: 'value', label: 'Valor del auto' },
] as const

export type CoverageCategoryId = (typeof COVERAGE_CATEGORIES)[number]['id']

export type CoverageItem = {
  key: string
  category: CoverageCategoryId
  label: string
  explain: string
}

/** Lista fija de coberturas: las filas de la comparación siempre son las mismas. */
export const COVERAGE_CATALOG: CoverageItem[] = [
  {
    key: 'rc',
    category: 'third',
    label: 'Responsabilidad civil',
    explain:
      'Si le hacés daño a una persona o al auto de otro, la aseguradora paga hasta este tope. Es lo más importante del seguro.',
  },
  {
    key: 'damage_total',
    category: 'damage',
    label: 'Destrucción total por accidente',
    explain:
      'Si el arreglo sale el 80% o más de lo que vale el auto, se considera pérdida total y te pagan el valor del auto.',
  },
  {
    key: 'damage_partial',
    category: 'damage',
    label: 'Daños parciales por accidente',
    explain:
      'Choques y golpes que se arreglan. La franquicia es lo que ponés vos de tu bolsillo en cada siniestro.',
  },
  {
    key: 'damage_between_insured',
    category: 'damage',
    label: 'Choque con otro asegurado de la compañía',
    explain:
      'Cláusula especial para cuando el otro auto también está asegurado en la misma compañía.',
  },
  {
    key: 'cleas',
    category: 'damage',
    label: 'Sistema CLEAS',
    explain:
      'Si te chocan y el culpable tiene seguro en una compañía adherida, tu aseguradora te repara y lo arreglan entre ellas.',
  },
  {
    key: 'fire',
    category: 'theft',
    label: 'Incendio',
    explain: 'Incendio total o parcial del auto.',
  },
  {
    key: 'theft_total',
    category: 'theft',
    label: 'Robo o hurto total',
    explain: 'Si se llevan el auto.',
  },
  {
    key: 'theft_partial',
    category: 'theft',
    label: 'Robo o hurto parcial',
    explain:
      'Si roban partes del auto. Suelen quedar afuera cosas como tazas, espejos externos, escobillas y equipos de sonido.',
  },
  {
    key: 'wheels',
    category: 'theft',
    label: 'Robo de ruedas',
    explain:
      'Si te roban una o más ruedas, las reponen de características similares sin descontar por uso.',
  },
  {
    key: 'glass_windows',
    category: 'glass',
    label: 'Cristales de puertas, parabrisas y luneta',
    explain: 'Rotura de vidrios. Ver si tiene franquicia o tope.',
  },
  {
    key: 'glass_roof',
    category: 'glass',
    label: 'Cristal de techo',
    explain: 'Rotura del techo vidriado. Importante en autos con techo panorámico.',
  },
  {
    key: 'locks',
    category: 'glass',
    label: 'Cerraduras',
    explain: 'Rotura de cerraduras de puertas y baúl, incluidas las de seguridad.',
  },
  {
    key: 'hail',
    category: 'weather',
    label: 'Granizo',
    explain: 'Daños por granizo. Vital en Córdoba.',
  },
  {
    key: 'flood',
    category: 'weather',
    label: 'Inundación',
    explain: 'Daños por agua: desborde de ríos, lluvias torrenciales, subida del mar.',
  },
  {
    key: 'quake',
    category: 'weather',
    label: 'Terremoto',
    explain: 'Daños por terremoto.',
  },
  {
    key: 'towing',
    category: 'assist',
    label: 'Remolque',
    explain: 'Grúa hasta el taller. Fijate los kilómetros y cuántas veces por año.',
  },
  {
    key: 'assistance',
    category: 'assist',
    label: 'Asistencia mecánica y servicios',
    explain:
      'Auxilio en ruta, mecánica ligera, urgencia médica, asistencia legal telefónica, etc.',
  },
  {
    key: 'replacement_car',
    category: 'assist',
    label: 'Auto sustituto',
    explain: 'Te prestan un auto mientras el tuyo está robado o en reparación.',
  },
  {
    key: 'use_loss',
    category: 'assist',
    label: 'Privación de uso',
    explain: 'Plata por los días que no tenés el auto mientras se repara.',
  },
  {
    key: 'death',
    category: 'people',
    label: 'Muerte en accidente',
    explain: 'Indemnización por muerte de ocupantes o conductor en un accidente.',
  },
  {
    key: 'border',
    category: 'people',
    label: 'Países limítrofes',
    explain: 'Si la cobertura sigue valiendo cuando viajás a Chile, Uruguay, Brasil, etc.',
  },
  {
    key: 'insured_sum',
    category: 'value',
    label: 'Suma asegurada',
    explain:
      'El valor con el que se asegura el auto. Tiene que acompañar el precio real: si queda corta, cobrás menos en un robo o pérdida total.',
  },
  {
    key: 'zero_km',
    category: 'value',
    label: 'Valor 0 km',
    explain:
      'Cuánto tiempo, si hay pérdida total, te pagan el auto como 0 km y no como usado.',
  },
]

export function emptyCoverages(): CoverageMap {
  return Object.fromEntries(
    COVERAGE_CATALOG.map((item) => [item.key, { status: 'unknown', detail: '' }]),
  )
}

/** Completa las claves que falten (por si el catálogo crece) con "Preguntar". */
export function normalizeCoverages(map: CoverageMap | null | undefined): CoverageMap {
  const base = emptyCoverages()
  for (const item of COVERAGE_CATALOG) {
    const value = map?.[item.key]
    if (value) base[item.key] = value
  }
  return base
}

/** La cobertura se considera "distinta" si no todas las pólizas dicen lo mismo. */
export function coverageDiffers(values: CoverageValue[]) {
  return new Set(values.map((v) => v.status)).size > 1
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Días para no renovar: la póliza pide aviso con 15 días corridos de antelación. */
export function renewalNoticeDate(validTo: string) {
  const d = new Date(`${validTo}T00:00:00Z`)
  return new Date(d.getTime() - 15 * DAY_MS).toISOString().slice(0, 10)
}
