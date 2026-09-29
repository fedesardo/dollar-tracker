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

test('desde la cuota 5 la diferencia con la cuota fija es el IVA (21%) del interés', () => {
  const rows = buildAmortization(10_000_000, 19.9, 18, 647151.39)
  // Cuota 5 del banco: 675.102,73
  assert.ok(Math.abs(647151.39 + rows[4].interest * 0.21 - 675102.73) < 0.5)
  // Cuota 18 del banco: 649.368,10
  assert.ok(Math.abs(647151.39 + rows[17].interest * 0.21 - 649368.1) < 0.5)
})
