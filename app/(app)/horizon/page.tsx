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
              <span className="text-xs uppercase tracking-wider">
                Objetivo {plan.targetTypology} · {plan.targetLotSqm} m²
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
                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                  Tenemos actualizado
                </p>
                <p className="font-mono tabular-nums text-base sm:text-xl text-text-primary mt-1">
                  {formatARS(metrics.updatedCapitalArs)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                  Nos falta
                </p>
                <p className="font-mono tabular-nums text-base sm:text-xl text-accent-purple mt-1">
                  {formatARS(metrics.remainingArs)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Vivienda elegida
            </p>
            <p className="font-display text-xl font-semibold mt-2">
              Standard · 2 dormitorios
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Lote largo de 250 m², sujeto a disponibilidad del barrio.
            </p>
            <div className="border-t border-[var(--border)] mt-4 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                Valor vigente
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
              <p className="text-xs text-text-muted">Plan actual</p>
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
              <p className="text-xs text-text-muted">Puntaje actual Horizonte</p>
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
              <p className="text-xs text-text-muted">Revalorización</p>
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
            <p className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
              {label}
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
