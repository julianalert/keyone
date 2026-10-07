import type { SupabaseClient } from '@supabase/supabase-js'

// Take a settled call out of the agency wallet and return what was charged.
// deduct_wallet refuses an amount above the balance and then deducts nothing,
// so a call that cost more than what is left would go unpaid: take what is
// left instead. Throws when the deduction fails for any other reason.
export async function chargeWallet(
  supabase: SupabaseClient,
  agencyId: string,
  amount: number,
  description: string,
  callId: string | null
): Promise<number> {
  let charge = amount
  // The balance can move between the refusal and the retry; a few rounds settle it
  for (let attempt = 0; attempt < 3 && charge > 0; attempt++) {
    const { error } = await supabase.rpc('deduct_wallet', {
      p_agency_id: agencyId,
      p_amount: charge,
      p_description: description,
      p_api_call_id: callId,
    })
    if (!error) {
      if (charge < amount) console.error(`[billing] wallet of agency ${agencyId} was $${(amount - charge).toFixed(6)} short on call ${callId}`)
      return charge
    }
    if (!error.message.includes('insufficient_balance')) throw new Error(`deduct_wallet failed: ${error.message}`)
    const { data } = await supabase.from('wallets').select('balance_usd').eq('agency_id', agencyId).single()
    charge = Math.min(amount, Math.max(0, Number(data?.balance_usd ?? 0)))
  }
  console.error(`[billing] nothing left in the wallet of agency ${agencyId}: $${amount.toFixed(6)} unpaid on call ${callId}`)
  return 0
}
