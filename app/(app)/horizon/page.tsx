import {
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  House,
  ReceiptText,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { getHorizonDashboard } from '@/lib/queries/horizon'
import { formatARS, formatDateShort } from '@/lib/utils/format'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HorizonActions } from '@/components/horizon/HorizonActions'
import { HorizonContributionHistory } from '@/components/horizon/HorizonContributionHistory'
import { InfoTooltip } from '@/components/shared/InfoTooltip'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const pct = (value: number, digits = 4) =>
  `${value.toLocaleString('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`

const points = (value: number) =>
  value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default async function HorizonPage() {
  const { plan, valuations, contributions, metrics, asOf } =
    await getHorizonDashboard()
  const currentOfficialValuation = [...valuations]
    .filter(
      (valuation) =>
        valuation.kind === 'official_plan' && valuation.effectiveOn <= asOf,
    )
    .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn))[0]
  const currentTargetValuation = [...valuations]
    .filter(
      (valuation) =>
        valuation.kind === 'target_home' && valuation.effectiveOn <= asOf,
    )
    .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn))[0]

  return (
    <div className="space-y-5 stagger">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple">Independiente de tus dólares</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Casita Horizonte
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Lo que pusimos, cuánto avanzamos y cuánto falta para la B68.
          </p>
        </div>
        <HorizonActions />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-accent-purple/20 bg-bg-card p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-purple/10 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-7">
          <div>
            <div className="flex items-center gap-2 text-text-secondary">
              <House className="h-4 w-4 text-accent-purple" />
              <span className="flex items-center gap-1 text-xs uppercase tracking-wider">
                Objetivo {plan.targetTypology} · {plan.targetLotSqm} m²
                <InfoTooltip
                  size="xs"
                  text="Es la B68 de 2 dormitorios con lote largo de 250 m² que quieren elegir al adjudicar. La cooperativa hace la conversión oficial en ese momento."
                />
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-1 mt-4">
              <p className="font-display text-5xl sm:text-6xl font-bold tracking-tight">
                {pct(metrics.targetPercentage)}
              </p>
              <p className="text-sm text-text-muted pb-2">de nuestra casa</p>
            </div>
            <Progress
              value={Math.min(100, metrics.targetPercentage)}
              className="h-3 mt-5 bg-bg-elevated"
              indicatorColor="var(--purple)"
            />
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                  Tenemos actualizado
                  <InfoTooltip
                    size="xs"
                    text="Es el valor de hoy del porcentaje que ya tienen cancelado, usando el precio vigente de su plan actual D30."
                  />
                </p>
                <p className="font-mono tabular-nums text-base sm:text-xl text-text-primary mt-1">
                  {formatARS(metrics.updatedCapitalArs)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                  Nos falta
                  <InfoTooltip
                    size="xs"
                    text="Es la diferencia entre el valor vigente de la B68 elegida y el capital actualizado que ya tienen. Cambia cuando Horizonte actualiza su lista."
                  />
                </p>
                <p className="font-mono tabular-nums text-base sm:text-xl text-accent-purple mt-1">
                  {formatARS(metrics.remainingArs)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-5">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
              Vivienda elegida
              <InfoTooltip
                size="xs"
                text="Es el objetivo que usamos para proyectar el avance. La elección definitiva depende de la adjudicación y de la disponibilidad de lotes largos."
              />
            </p>
            <p className="font-display text-xl font-semibold mt-2">
              Standard · 2 dormitorios
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Lote largo de 250 m², sujeto a disponibilidad del barrio.
            </p>
            <div className="border-t border-[var(--border)] mt-4 pt-4">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                Valor vigente
                <InfoTooltip
                  size="xs"
                  text="Último precio de lista cargado para la B68/0/L. Actualizalo cuando tengan una lista nueva de Horizonte."
                />
              </p>
              <p className="font-mono tabular-nums text-lg mt-1">
                {formatARS(metrics.targetValueArs)}
              </p>
              {currentTargetValuation && (
                <p className="text-[11px] text-text-muted mt-1">
                  Desde {formatDateShort(currentTargetValuation.effectiveOn)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-xs text-text-muted">
                Plan actual
                <InfoTooltip
                  size="xs"
                  text="Es el porcentaje cancelado en su plan D30/0/D. Cada aporte a vivienda compra un porcentaje; ese porcentaje se mantiene aunque suba el valor de la casa."
                />
              </p>
              <Target className="h-4 w-4 text-accent-blue" />
            </div>
            <p className="font-display text-3xl font-bold mt-3">
              {pct(metrics.officialPercentage)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {plan.officialTypology} · {formatARS(metrics.officialValueArs)}
            </p>
            {currentOfficialValuation && (
              <p className="text-[10px] text-text-muted mt-2">
                Valor vigente desde {formatDateShort(currentOfficialValuation.effectiveOn)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-xs text-text-muted">
                Puntaje actual Horizonte
                <InfoTooltip
                  size="xs"
                  text="Horizonte calcula 1,5 puntos por cada mes con aporte al día, más 2 puntos por cada porcentaje cancelado del plan actual."
                />
              </p>
              <Sparkles className="h-4 w-4 text-accent-yellow" />
            </div>
            <p className="font-display text-3xl font-bold mt-3">
              {points(metrics.officialScore)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {points(metrics.seniorityPoints)} antigüedad +{' '}
              {points(metrics.officialPercentagePoints)} porcentaje
            </p>
            <p className="text-[10px] text-text-muted mt-2">
              {metrics.activeMonths} meses cumplidos · conversión estimada a B68:{' '}
              {points(metrics.targetScore)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-xs text-text-muted">
                Revalorización
                <InfoTooltip
                  size="xs"
                  text="Es el valor actualizado de lo que ya tienen menos lo que efectivamente destinaste a vivienda. No es dinero disponible: muestra cómo creció el valor de su porcentaje al actualizarse la casa."
                />
              </p>
              <TrendingUp className="h-4 w-4 text-accent-green" />
            </div>
            <p className="font-mono tabular-nums text-2xl font-semibold text-accent-green mt-3">
              {formatARS(metrics.revaluationArs)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Crecimiento sobre el aporte nominal a vivienda.
            </p>
            <p className="text-[10px] text-text-muted mt-2">
              El porcentaje comprado conserva su valor actualizado.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total pagado',
            value: metrics.totalPaidArs,
            Icon: CircleDollarSign,
            color: 'text-text-primary',
          },
          {
            label: 'A vivienda',
            value: metrics.totalHousingNominalArs,
            Icon: House,
            color: 'text-accent-green',
          },
          {
            label: 'Gastos',
            value: metrics.totalExpensesArs,
            Icon: ReceiptText,
            color: 'text-accent-orange',
          },
          {
            label: 'Valor actualizado',
            value: metrics.updatedCapitalArs,
            Icon: TrendingUp,
            color: 'text-accent-purple',
          },
        ].map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-bg-card p-4"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted mt-3">
              {label}
              <InfoTooltip
                size="xs"
                text={
                  label === 'Total pagado'
                    ? 'La suma de todos los pagos registrados a Horizonte, incluidos los gastos del período.'
                    : label === 'A vivienda'
                      ? 'La parte de cada pago que queda después de descontar gastos. Es la que compra porcentaje del plan.'
                      : label === 'Gastos'
                        ? 'Seguros, administración, A.M.A.C., cuotas sociales y otros conceptos. Mantienen el plan al día y suman antigüedad, pero no compran porcentaje.'
                        : 'El valor de hoy del porcentaje cancelado en el plan actual, según la última lista cargada.'
                }
              />
            </p>
            <p
              className={`font-mono tabular-nums text-sm sm:text-base font-medium mt-1 ${color}`}
            >
              {formatARS(value)}
            </p>
          </div>
        ))}
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Historial de aportes</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Los importes del Excel están preservados como historial; el porcentaje
              oficial abre en 7,2527%.
            </p>
          </div>
          <CalendarCheck className="h-5 w-5 text-accent-green flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-0">
          <HorizonContributionHistory contributions={contributions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo se calcula</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
          <div className="rounded-xl bg-bg-elevated p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Pagás
            </p>
            <p className="text-sm mt-1">Total menos gastos</p>
          </div>
          <ArrowRight className="hidden md:block h-4 w-4 text-text-muted" />
          <div className="rounded-xl bg-bg-elevated p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Comprás
            </p>
            <p className="text-sm mt-1">Un porcentaje de la D30</p>
          </div>
          <ArrowRight className="hidden md:block h-4 w-4 text-text-muted" />
          <div className="rounded-xl bg-bg-elevated p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Proyectamos
            </p>
            <p className="text-sm mt-1">Su equivalente en la B68</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
