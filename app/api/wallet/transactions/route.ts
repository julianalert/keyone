import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/wallet/transactions — full history with pagination
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 25))
  const offset = (page - 1) * limit

  const { data: transactions, count, error } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ transactions: transactions ?? [], total: count ?? 0, page, limit })
}
