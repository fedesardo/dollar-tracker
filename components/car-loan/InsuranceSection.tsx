import {
  CalendarClock,
  Car,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { getCarInsuranceDashboard } from '@/lib/queries/carInsurance'
import {
  COVERAGE_CATALOG,
  COVERAGE_CATEGORIES,
  renewalNoticeDate,
} from '@/lib/utils/carInsurance'
import { formatARS, formatDateShort } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { CoverageStatusIcon } from '@/components/car-loan/CoverageStatusIcon'
import { InsuranceActions } from '@/components/car-loan/InsuranceActions'
import { InsuranceCompare } from '@/components/car-loan/InsuranceCompare'

// Lo que hay que tener presente de la póliza Mapfre (condiciones generales).
const WATCH_OUTS = [
  'Si no pagás una cuota, la cobertura se suspende desde las 24 hs del día del vencimiento, sin aviso. Se rehabilita a las 0 hs del día siguiente al pago.',
  'No cubre si el conductor tiene 1 g/l de alcohol o más (o se niega al test), ni si va a más del 40% por encima de la velocidad máxima permitida.',
  'Si usás el auto para algo distinto de particular (por ejemplo apps de viajes) sin avisar, te pueden rechazar el siniestro.',
  'Si te mudás a una zona de mayor riesgo y no avisás antes, se suspende la cobertura del auto. La póliza está cotizada para el CP 5000.',
  'El valor 0 km es sólo por 90 días desde la compra. Después, en una pérdida total, te pagan como usado.',
  'Como el auto está prendado, en una pérdida total ICBC cobra primero hasta el monto de tu deuda.',
]

export async function InsuranceSection() {
  const { current, offers } = await getCarInsuranceDashboard()
  const premium = current.monthlyPremiumArs ? Number(current.monthlyPremiumArs) : null
  const noticeBy = current.validTo ? renewalNoticeDate(current.validTo) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold">Seguro del BYD</h2>
          <p className="text-sm text-text-muted mt-1">
            Qué te cubre la póliza de hoy y cómo se compara con otras ofertas.
          </p>
        </div>
        <InsuranceActions currentCoverages={current.coverages} />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-accent-green/20 bg-bg-card p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div>
            <div className="flex items-center gap-2 text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-accent-green" />
              <span className="text-xs uppercase tracking-wider">Póliza vigente</span>
            </div>
            <p className="font-display text-3xl sm:text-4xl font-bold mt-3">
              {current.insurer} · {current.planName}
            </p>
            {current.validFrom && current.validTo && (
              <p className="text-sm text-text-secondary mt-2">
                Del {formatDateShort(current.validFrom)} al {formatDateShort(current.validTo)}.
                Es cuatrimestral y se renueva sola.
              </p>
            )}
            {current.notes && <p className="text-xs text-text-muted mt-1">{current.notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl border border-accent-green/20 bg-accent-green/5 p-4">
              <Car className="h-4 w-4 text-accent-green" />
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted mt-3">
                Valor asegurado del auto
                <InfoTooltip
                  size="xs"
                  text="Es hasta cuánto te pagan en un robo o pérdida total. Tiene ajuste automático de hasta 20% si el valor del auto sube, y sólo se paga como 0 km durante los primeros 90 días."
                />
              </p>
              <p className="font-mono tabular-nums text-2xl mt-1">
                {current.insuredSumArs ? formatARS(current.insuredSumArs) : '—'}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Con ajuste automático de hasta 20%
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-4">
              <Wallet className="h-4 w-4 text-accent-orange" />
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted mt-3">
                Por mes
                <InfoTooltip
                  size="xs"
                  text="Premio del cuatrimestre ($ 555.963,09) dividido en 4 cuotas mensuales. En cada renovación se actualiza el precio."
                />
              </p>
              <p className="font-mono tabular-nums text-lg mt-1">
                {premium ? formatARS(premium) : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-4">
              <CalendarClock className="h-4 w-4 text-accent-purple" />
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted mt-3">
                Renueva
                <InfoTooltip
                  size="xs"
                  text="Para no renovar hay que avisar por escrito con 15 días corridos de antelación. Con la prenda, ICBC tiene que aceptar la póliza nueva."
                />
              </p>
              <p className="font-mono tabular-nums text-lg mt-1">
                {current.validTo ? formatDateShort(current.validTo) : '—'}
              </p>
              {noticeBy && (
                <p className="text-[11px] text-text-muted mt-1">
                  Avisá antes del {formatDateShort(noticeBy)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Qué te cubre</CardTitle>
          <p className="text-xs text-text-muted mt-1">
            Resumen de la póliza en criollo. Los montos son los del frente de póliza.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {COVERAGE_CATEGORIES.map((category) => (
            <div key={category.id}>
              <p className="border-y border-[var(--border)] bg-bg-elevated/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:px-5">
                {category.label}
              </p>
              <div className="divide-y divide-[var(--border)]">
                {COVERAGE_CATALOG.filter((item) => item.category === category.id).map((item) => {
                  const value = current.coverages[item.key]
                  return (
                    <div key={item.key} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                      <CoverageStatusIcon status={value.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{item.explain}</p>
                        {value.detail && (
                          <p className="text-xs text-text-secondary mt-1.5">{value.detail}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-yellow" />
          <div>
            <CardTitle>Para tener presente</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Letra chica de la póliza Mapfre que conviene no olvidarse.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {WATCH_OUTS.map((text) => (
              <li key={text} className="flex gap-2.5 text-sm text-text-secondary">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-accent-yellow" />
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Comparar ofertas</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Mapfre contra lo que te ofrezcan. {offers.length > 0 && `${offers.length} cargada${offers.length > 1 ? 's' : ''}.`}
            </p>
          </div>
          <Badge variant="muted">Sólo informativo</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <InsuranceCompare current={current} offers={offers} />
        </CardContent>
      </Card>
    </div>
  )
}
