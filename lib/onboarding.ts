import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { appUrl, fromEmail } from '@/lib/config'

export interface Milestones {
  has_client: boolean
  has_project: boolean
  has_call: boolean
  has_budget: boolean
  has_agent: boolean
  complete: boolean
  dismissed: boolean
}

// Derived from real data every time, never from stored flags.
export async function getMilestones(supabase: SupabaseClient, agencyId: string): Promise<Milestones> {
  const [clients, projects, calls, budgets, clientBudgets, agentKeys, agency] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId),
    supabase.from('api_calls').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'completed'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).not('monthly_budget_usd', 'is', null),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).not('monthly_budget_usd', 'is', null),
    supabase.from('agency_keys').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).is('revoked_at', null),
    supabase.from('agencies').select('onboarding_dismissed_at').eq('id', agencyId).single(),
  ])
  const m = {
    has_client: (clients.count ?? 0) > 0,
    has_project: (projects.count ?? 0) > 0,
    has_call: (calls.count ?? 0) > 0,
    has_budget: (budgets.count ?? 0) + (clientBudgets.count ?? 0) > 0,
    has_agent: (agentKeys.count ?? 0) > 0,
  }
  return { ...m, complete: Object.values(m).every(Boolean), dismissed: !!agency.data?.onboarding_dismissed_at }
}

function resendConfigured(): boolean {
  const k = process.env.RESEND_API_KEY ?? ''
  return k.startsWith('re_') && k !== 're_...'
}

// Sent once, on the first dashboard visit. Returns true if it went out now.
export async function sendWelcomeIfNeeded(supabase: SupabaseClient, agencyId: string, email: string, origin: string): Promise<boolean> {
  const { data: agency } = await supabase.from('agencies').select('name, welcome_sent_at').eq('id', agencyId).single()
  if (!agency || agency.welcome_sent_at) return false

  // Mark first so a slow email can't be sent twice by concurrent loads
  const { data: claimed } = await supabase
    .from('agencies')
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq('id', agencyId)
    .is('welcome_sent_at', null)
    .select('id')
    .maybeSingle()
  if (!claimed || !resendConfigured()) return false

  const base = appUrl(origin)
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: fromEmail('alerts'),
      to: email,
      subject: `Welcome to key.one, ${agency.name}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;line-height:1.5">
        <h2 style="font-size:20px;font-weight:500">One key per client project. Every model. Spend under control.</h2>
        <p style="color:#5F5E5A">Your wallet starts with <strong>$3</strong> of credit. Three steps to your first call:</p>
        <ol style="color:#5F5E5A;padding-left:20px">
          <li>Add a client and a project. The project gets its key.</li>
          <li>Point the OpenAI or Anthropic SDK at key.one with that key.</li>
          <li>Set a budget. Calls stop at the limit, and you can see spend per client.</li>
        </ol>
        <p style="color:#5F5E5A">Using Claude Code or Cursor? Paste this into the chat and it sets itself up:</p>
        <pre style="background:#F1EFE8;padding:12px;border-radius:6px;font-size:13px">set up ${base}/skill.md</pre>
        <a href="${base}/dashboard" style="display:inline-block;margin-top:12px;background:#1a1a18;color:#F9F7F3;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">Open key.one</a>
        <p style="margin-top:24px;font-size:12px;color:#888780">You're receiving this because you created a key.one account.</p>
      </div>`,
    })
    return true
  } catch (err) {
    console.error('[onboarding] welcome email failed:', err)
    return false
  }
}
