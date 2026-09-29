import Link from 'next/link'
import { CalendarClock, Car, Landmark, ShieldCheck, Wallet } from 'lucide-react'
import { getCarLoanDashboard } from '@/lib/queries/carLoan'
import { formatARS, formatDateShort } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CarLoanActions } from '@/components/car-loan/CarLoanActions'
import { CarLoanInstallments } from '@/components/car-loan/CarLoanInstallments'
import { InfoTooltip } from '@/components/shared/InfoTooltip'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CarLoanPage() {
  const { loan, metrics, asOf } = await getCarLoanDashboard()
  const progress = (metrics.paidCount / metrics.totalCount) * 100

  const stats = [
    {
      label: 'Total pagado',
      value: metrics.totalPaid,
      Icon: Wallet,
      color: 'text-text-primary',
      tip: 'Todo lo que pagaste hasta hoy: crédito más seguro.',
    },
    {
      label: 'Del crédito',
      value: metrics.creditPaid,
      Icon: Landmark,
      color: 'text-accent-blue',
      tip: 'Cuota fija del sistema francés (capital + interés) más el IVA del 21% sobre el interés, por cada cuota pagada.',
    },
    {
      label: 'De seguro',
      value: metrics.insurancePaid,
      Icon: ShieldCheck,
      color: 'text-accent-orange',
      tip: 'Lo que pagaste menos el crédito con IVA, cuota por cuota. Varía con la inflación.',
    },
    {
      label: 'Falta pagar (est.)',
      value: metrics.remainingProjected,
      Icon: CalendarClock,
      color: 'text-accent-purple',
      tip: 'Suma de las cuotas pendientes con el valor que informó el banco (o el que cargaste).',
    },
  ]

  return (
    <div className="space-y-5 stagger">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple">Independiente de tus dólares</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Préstamo BYD</h1>
          <p className="text-sm text-text-muted mt-1">
            {loan.lender} · {metrics.totalCount} cuotas el 28 de cada mes. Crédito fijo, seguro variable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href="/car-loan/seguro">
              <ShieldCheck className="h-4 w-4" />
              Ver póliza
            </Link>
          </Button>
          <CarLoanActions nextNumber={metrics.next?.number ?? metrics.totalCount} />
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-accent-purple/20 bg-bg-card p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-purple/10 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-7">
          <div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Car className="h-4 w-4 text-accent-purple" />
              <span className="flex items-center gap-1 text-xs uppercase tracking-wider">
                Capital adeudado
                <InfoTooltip
                  size="xs"
                  text="Capital que todavía debés del crédito, sin seguro ni intereses futuros. Sale del cuadro de amortización francés (TNA y cuota fija)."
                />
              </span>
            </div>
            <p className="font-mono tabular-nums text-4xl sm:text-5xl font-bold tracking-tight mt-4">
              {formatARS(metrics.outstandingCapital, { decimals: true })}
            </p>
            <Progress
              value={progress}
              className="h-3 mt-5 bg-bg-elevated"
              indicatorColor="var(--purple)"
            />
            <p className="text-sm text-text-muted mt-3">
              <span className="font-mono tabular-nums text-text-primary">
                {metrics.paidCount}
              </span>{' '}
              de {metrics.totalCount} cuotas pagadas · crédito inicial{' '}
              <span className="font-mono tabular-nums">
                {formatARS(loan.principalArs)}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated/70 p-5 space-y-4">
            <div>
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                Cuota fija del crédito
                <InfoTooltip
                  size="xs"
                  text={`Sistema francés, ${Number(loan.tnaPct).toLocaleString('es-AR')}% TNA, ${loan.totalInstallments} cuotas sobre ${formatARS(loan.principalArs)}. Es la parte que no cambia. A eso se suma el IVA (21% del interés) y el seguro.`}
                />
              </p>
              <p className="font-mono tabular-nums text-xl mt-1">
                {formatARS(metrics.fixedInstallment, { decimals: true })}
              </p>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                Próxima cuota
              </p>
              {metrics.next ? (
                <>
                  <p className="font-mono tabular-nums text-lg mt-1">
                    {formatARS(metrics.next.expectedTotal, { decimals: true })}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Cuota {metrics.next.number} · vence {formatDateShort(metrics.next.dueOn)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-accent-green mt-1">Todo pagado. Auto libre.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, Icon, color, tip }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-bg-card p-4"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted mt-3">
              {label}
              <InfoTooltip size="xs" text={tip} />
            </p>
            <p className={`font-mono tabular-nums text-sm sm:text-base font-medium mt-1 ${color}`}>
              {formatARS(value)}
            </p>
          </div>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cuotas</CardTitle>
          <p className="text-xs text-text-muted mt-1">
            Al pagar cargás lo que salió realmente; la diferencia con crédito + IVA es el
            seguro del mes.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <CarLoanInstallments
            rows={metrics.rows}
            asOf={asOf}
          />
        </CardContent>
      </Card>
    </div>
  )
}
