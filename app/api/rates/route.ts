import { NextResponse } from 'next/server'

type DolarApiRate = {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

export type RatesPayload = {
  blue: { compra: number; venta: number; updated: string } | null
  oficial: { compra: number; venta: number; updated: string } | null
  mep: { compra: number; venta: number; updated: string } | null
  ccl: { compra: number; venta: number; updated: string } | null
  fetchedAt: string
}

async function fetchRate(slug: string) {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as DolarApiRate
    return {
      compra: data.compra,
      venta: data.venta,
      updated: data.fechaActualizacion,
    }
  } catch {
    return null
  }
}

export async function GET() {
  const [blue, oficial, mep, ccl] = await Promise.all([
    fetchRate('blue'),
    fetchRate('oficial'),
    fetchRate('mep'),
    fetchRate('contadoconliqui'),
  ])

  const payload: RatesPayload = {
    blue,
    oficial,
    mep,
    ccl,
    fetchedAt: new Date().toISOString(),
  }
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
