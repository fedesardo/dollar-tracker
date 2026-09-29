import 'server-only'

import { db } from '@/lib/db'
import { carInsurancePolicies } from '@/lib/db/schema'
import { type CoverageMap, normalizeCoverages } from '@/lib/utils/carInsurance'

export const MAPFRE_IMPORT_KEY = 'mapfre-nueva-todo-auto-2026'

// Resumen de la póliza Mapfre "Nueva Todo Auto" (condiciones particulares y
// anexos). Los montos son los del frente de póliza al 28/08/2026.
const MAPFRE_COVERAGES: CoverageMap = {
  rc: {
    status: 'yes',
    detail:
      'Hasta $ 208.000.000 por acontecimiento, a terceros transportados y no transportados (daños personales y a cosas).',
  },
  damage_total: {
    status: 'yes',
    detail: 'Totales por accidente sin franquicia.',
  },
  damage_partial: {
    status: 'partial',
    detail: 'Con franquicia de $ 2.703.500 por siniestro.',
  },
  damage_between_insured: {
    status: 'partial',
    detail:
      'Un evento por año, con límite de cobertura de $ 600.000 (cláusula CA-DI 14.2).',
  },
  cleas: { status: 'yes', detail: 'Incluido (cláusula CA-CO 8.1).' },
  fire: { status: 'yes', detail: 'Parcial y total, sin franquicia.' },
  theft_total: { status: 'yes', detail: 'Sin franquicia.' },
  theft_partial: { status: 'yes', detail: 'Sin franquicia.' },
  wheels: {
    status: 'yes',
    detail: 'Reposición ilimitada, sin descuento por depreciación (CA-RH 5.1).',
  },
  glass_windows: { status: 'yes', detail: 'Sin franquicia.' },
  glass_roof: { status: 'yes', detail: 'Con límite de $ 8.110.500.' },
  locks: { status: 'yes', detail: 'Sin franquicia, con límite de $ 8.110.500.' },
  hail: { status: 'yes', detail: 'Sin límite y sin franquicia.' },
  flood: { status: 'yes', detail: 'Con límite de $ 8.110.500.' },
  quake: {
    status: 'yes',
    detail: 'Cláusula CA-DA 5.1 incluida; el frente no informa un límite propio.',
  },
  towing: {
    status: 'yes',
    detail: 'Hasta 300 km lineales. 6 servicios por año, 1 por mes.',
  },
  assistance: {
    status: 'yes',
    detail:
      'Aon Assist (0800-333-4836): mecánica ligera, depósito, urgencia médica, asistencia legal telefónica, conductor profesional, viajes de más de 100 km. Pedir las condiciones para ver límites.',
  },
  replacement_car: {
    status: 'partial',
    detail: 'Por robo o accidente, según Aon Assist. Límites en sus condiciones.',
  },
  use_loss: {
    status: 'no',
    detail: 'No indemniza la privación de uso, aunque el siniestro esté cubierto.',
  },
  death: {
    status: 'partial',
    detail: 'Suma asegurada por muerte de $ 400.000 (cláusula CA-CO 16.1).',
  },
  border: {
    status: 'yes',
    detail:
      'Robo, daños e incendio en países limítrofes. Responsabilidad civil Mercosur (Bolivia, Brasil, Chile, Paraguay, Uruguay): US$ 40.000 por persona y US$ 20.000 por daños materiales.',
  },
  insured_sum: {
    status: 'yes',
    detail: '$ 54.070.000, con ajuste automático de hasta 20% (CA-CC 4.2).',
  },
  zero_km: {
    status: 'partial',
    detail:
      'Valor 0 km hasta 90 días desde la compra. De 91 a 180 días, promedio entre 0 km y usado. Después, valor de usado.',
  },
}

/** Alta única e idempotente de la póliza vigente. */
export async function ensureCurrentInsuranceData() {
  await db
    .insert(carInsurancePolicies)
    .values({
      kind: 'current',
      insurer: 'Mapfre',
      planName: 'Nueva Todo Auto',
      // Premio cuatrimestral $ 555.963,09 en 4 cuotas mensuales.
      monthlyPremiumArs: (555963.09 / 4).toFixed(2),
      validFrom: '2026-08-28',
      validTo: '2026-12-28',
      insuredSumArs: '54070000.00',
      notes:
        'Póliza cuatrimestral con renovación automática. Acreedor prendario: ICBC.',
      coverages: normalizeCoverages(MAPFRE_COVERAGES),
      importKey: MAPFRE_IMPORT_KEY,
    })
    .onConflictDoNothing()
}
