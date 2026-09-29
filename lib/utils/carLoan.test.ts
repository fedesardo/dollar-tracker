import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAmortization, frenchInstallment } from './carLoan'

test('cuota fija del crédito BYD: 10M, TNA 19,90%, 18 cuotas', () => {
  assert.equal(frenchInstallment(10_000_000, 19.9, 18), 647151.39)
})

test('el cuadro de amortización cierra en cero y da el capital del banco tras la cuota 1', () => {
  const rows = buildAmortization(10_000_000, 19.9, 18, 647151.39)
  assert.ok(Math.abs(rows[0].balance - 9_518_681.81) < 0.5)
  assert.equal(Math.round(rows[17].balance), 0)
})
