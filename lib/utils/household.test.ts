import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateStructure, currentAmount, monthlyEquivalent } from './household'

test('el monto vigente es el último cuyo mes ya llegó', () => {
  const points = [
    { effectiveFrom: '2026-10-01', amount: 100 },
    { effectiveFrom: '2027-01-01', amount: 130 },
  ]
  assert.equal(currentAmount(points, '2026-09'), null)
  assert.equal(currentAmount(points, '2026-12')?.amount, 100)
  assert.equal(currentAmount(points, '2027-01')?.amount, 130)
})

test('lo anual se prorratea por mes', () => {
  assert.equal(monthlyEquivalent(99, 12), 8.25)
})

test('estructura: suma pesos y dólares, cuenta faltantes y simula bajas', () => {
  const items = [
    { id: 'a', currency: 'ARS' as const, monthsPerCharge: 1, amount: 100000 },
    { id: 'b', currency: 'USD' as const, monthsPerCharge: 1, amount: 100 },
    { id: 'c', currency: 'ARS' as const, monthsPerCharge: 1, amount: null },
  ]
  const base = calculateStructure(items, 1000)
  assert.equal(base.totalArs, 200000)
  assert.equal(base.missing, 1)
  assert.equal(base.totalUsd, 200)
  assert.equal(calculateStructure(items, 1000, { b: 20 }).totalArs, 120000)
})
