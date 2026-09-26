import { NextResponse } from 'next/server'
import { listUserPrices, marginMultiplier } from '@/lib/billing/pricing'

// GET /api/pricing — every priced model with the user price applied.
// Public: prices are what a caller pays, not what key.one pays.
export async function GET() {
  const models = await listUserPrices()
  return NextResponse.json({ margin_multiplier: marginMultiplier(), unit: 'USD per 1M tokens', models })
}
