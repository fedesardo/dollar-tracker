import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  HorizonContribution,
  HorizonPlan,
  HorizonValuation,
} from '@/lib/db/schema'
import { calculateHorizonMetrics } from './horizon'

const plan = {
  openingOfficialPercentage: '7.252700',
  pointsPerActiveMonth: '1.50',
  pointsPerPercentage: '2.00',
} as HorizonPlan

const valuations = [
  {
    effectiveOn: '2026-07-14',
    kind: 'official_plan',
    amountArs: '57503033.77',
  },
  {
    effectiveOn: '2026-07-14',
    kind: 'target_home',
    amountArs: '113484848.03',
  },
] as HorizonValuation[]

const contributions = [
  ['2026-02-08', '600000.00', '44000.00', '556000.00'],
  ['2026-03-02', '800000.00', '44000.00', '756000.00'],
  ['2026-04-01', '700000.00', '44000.00', '656000.00'],
  ['2026-05-02', '925000.00', '44000.00', '881000.00'],
  ['2026-06-10', '400000.00', '44000.00', '356000.00'],
  ['2026-07-10', '700000.00', '44000.00', '656000.00'],
].map(([paidOn, grossAmountArs, expensesAmountArs, housingAmountArs]) => ({
  paidOn,
  grossAmountArs,
  expensesAmountArs,
  housingAmountArs,
  countsForSeniority: true,
  includedInOpeningSnapshot: true,
  acquiredPercentage: null,
})) as HorizonContribution[]

test('uses the official opening snapshot without double-counting imported payments', () => {
  const result = calculateHorizonMetrics(
    plan,
    valuations,
    contributions,
    '2026-07-23',
  )

  assert.equal(result.officialPercentage, 7.2527)
  assert.ok(Math.abs(result.updatedCapitalArs - 4_170_522.53) < 0.01)
  assert.ok(Math.abs(result.targetPercentage - 3.67495979) < 0.000001)
  assert.equal(result.totalPaidArs, 4_125_000)
  assert.equal(result.totalExpensesArs, 264_000)
  assert.equal(result.totalHousingNominalArs, 3_861_000)
  assert.equal(result.activeMonths, 6)
  assert.equal(result.seniorityPoints, 9)
  assert.equal(result.officialPercentagePoints, 14.5054)
  assert.equal(result.officialScore, 23.5054)
})

test('a new payment buys a fixed percentage and adds one seniority month', () => {
  const newContribution = {
    paidOn: '2026-08-10',
    grossAmountArs: '1000000.00',
    expensesAmountArs: '50000.00',
    housingAmountArs: '950000.00',
    acquiredPercentage: ((950_000 / 57_503_033.77) * 100).toFixed(8),
    countsForSeniority: true,
    includedInOpeningSnapshot: false,
  } as HorizonContribution

  const result = calculateHorizonMetrics(
    plan,
    valuations,
    [newContribution, ...contributions],
    '2026-08-10',
  )

  assert.ok(result.officialPercentage > 7.2527)
  assert.equal(result.activeMonths, 7)
  assert.equal(result.seniorityPoints, 10.5)
  assert.equal(result.totalPaidArs, 5_125_000)
})
