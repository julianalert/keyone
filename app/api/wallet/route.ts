import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { TOP_UP_MIN_USD, TOP_UP_MAX_USD, stripeConfigured, isTestMode } from '@/lib/billing/stripe'

// GET /api/wallet — agency balance + recent transactions
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const [{ data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('wallets').select('balance_usd, updated_at').eq('agency_id', agencyId).single(),
    supabase
      .from('wallet_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    balance_usd: Number(wallet?.balance_usd ?? 0),
    updated_at: wallet?.updated_at,
    recent_transactions: transactions ?? [],
    topup: { enabled: stripeConfigured(), test_mode: isTestMode(), min_usd: TOP_UP_MIN_USD, max_usd: TOP_UP_MAX_USD },
  })
}
