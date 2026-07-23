import type {
  HorizonContribution,
  HorizonPlan,
  HorizonValuation,
} from '@/lib/db/schema'
import { toNumber } from './format'

export type HorizonMetrics = {
  officialPercentage: number
  officialValueArs: number
  targetValueArs: number
  updatedCapitalArs: number
  targetPercentage: number
  remainingArs: number
  totalPaidArs: number
  totalExpensesArs: number
  totalHousingNominalArs: number
  revaluationArs: number
  activeMonths: number
  seniorityPoints: number
  officialPercentagePoints: number
  targetPercentagePoints: number
  officialScore: number
  targetScore: number
}

function latestValuation(
  valuations: HorizonValuation[],
  kind: HorizonValuation['kind'],
  asOf: string,
) {
  return valuations
    .filter((v) => v.kind === kind && v.effectiveOn <= asOf)
    .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn))[0]
}

export function calculateHorizonMetrics(
  plan: HorizonPlan,
  valuations: HorizonValuation[],
  contributions: HorizonContribution[],
  asOf: string,
): HorizonMetrics {
  const officialValuation = latestValuation(valuations, 'official_plan', asOf)
  const targetValuation = latestValuation(valuations, 'target_home', asOf)
  const officialValueArs = toNumber(officialValuation?.amountArs)
  const targetValueArs = toNumber(targetValuation?.amountArs)

  const additionalPercentage = contributions
    .filter((c) => !c.includedInOpeningSnapshot)
    .reduce((sum, c) => sum + toNumber(c.acquiredPercentage), 0)
  const officialPercentage =
    toNumber(plan.openingOfficialPercentage) + additionalPercentage
  const updatedCapitalArs =
    officialValueArs > 0 ? officialValueArs * (officialPercentage / 100) : 0
  const targetPercentage =
    targetValueArs > 0 ? (updatedCapitalArs / targetValueArs) * 100 : 0

  const totalPaidArs = contributions.reduce(
    (sum, c) => sum + toNumber(c.grossAmountArs),
    0,
  )
  const totalExpensesArs = contributions.reduce(
    (sum, c) => sum + toNumber(c.expensesAmountArs),
    0,
  )
  const totalHousingNominalArs = contributions.reduce(
    (sum, c) => sum + toNumber(c.housingAmountArs),
    0,
  )
  const months = new Set(
    contributions
      .filter((c) => c.countsForSeniority)
      .map((c) => c.paidOn.slice(0, 7)),
  )
  const activeMonths = months.size
  const seniorityPoints = activeMonths * toNumber(plan.pointsPerActiveMonth)
  const officialPercentagePoints =
    officialPercentage * toNumber(plan.pointsPerPercentage)
  const targetPercentagePoints =
    targetPercentage * toNumber(plan.pointsPerPercentage)

  return {
    officialPercentage,
    officialValueArs,
    targetValueArs,
    updatedCapitalArs,
    targetPercentage,
    remainingArs: Math.max(0, targetValueArs - updatedCapitalArs),
    totalPaidArs,
    totalExpensesArs,
    totalHousingNominalArs,
    revaluationArs: updatedCapitalArs - totalHousingNominalArs,
    activeMonths,
    seniorityPoints,
    officialPercentagePoints,
    targetPercentagePoints,
    officialScore: seniorityPoints + officialPercentagePoints,
    targetScore: seniorityPoints + targetPercentagePoints,
  }
}
