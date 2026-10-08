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
        <p style="color:#5F5E5A">Four steps to your first call:</p>
        <ol style="color:#5F5E5A;padding-left:20px">
          <li>Add funds to your wallet, from $5. Every call is paid from it.</li>
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

// ------------------------------------------------------------
// Agent path: a Sandbox client with a Default project, so an agent can
// start spending (within a small budget) before the human names real clients.
// ------------------------------------------------------------
export const SANDBOX_CLIENT = 'Sandbox'
export const SANDBOX_PROJECT = 'Default'
export const SANDBOX_BUDGET_USD = 10

export interface Sandbox {
  client_id: string
  client_name: string
  project_id: string
  project_name: string
  api_key: string          // freshly minted, shown once
  created: boolean         // false when the sandbox already existed (a new key was still minted)
}

// Idempotent on the client and project; always mints a new key, because a
// key can only be handed out at the moment it is created.
export async function ensureSandbox(service: SupabaseClient, agencyId: string): Promise<Sandbox> {
  const { generateProjectKey } = await import('@/lib/keys')
  let created = false

  let { data: client } = await service
    .from('clients').select('id, name').eq('agency_id', agencyId).eq('name', SANDBOX_CLIENT).is('is_active', true).maybeSingle()
  if (!client) {
    const { data: any } = await service.from('clients').select('id, name').eq('agency_id', agencyId).eq('name', SANDBOX_CLIENT).maybeSingle()
    client = any
  }
  if (!client) {
    const { data, error } = await service
      .from('clients').insert({ agency_id: agencyId, name: SANDBOX_CLIENT }).select('id, name').single()
    if (error || !data) throw new Error(error?.message ?? 'Could not create the sandbox client')
    client = data
    created = true
  }

  let { data: project } = await service
    .from('projects').select('id, name').eq('client_id', client.id).eq('name', SANDBOX_PROJECT).maybeSingle()
  if (!project) {
    const { data, error } = await service
      .from('projects')
      .insert({ agency_id: agencyId, client_id: client.id, name: SANDBOX_PROJECT, monthly_budget_usd: SANDBOX_BUDGET_USD })
      .select('id, name').single()
    if (error || !data) throw new Error(error?.message ?? 'Could not create the sandbox project')
    project = data
    created = true
  }

  const key = generateProjectKey()
  const { error: keyError } = await service.from('project_keys').insert({
    project_id: project.id, agency_id: agencyId, name: 'agent', key_hash: key.hash, key_prefix: key.prefix,
  })
  if (keyError) throw new Error(keyError.message)

  return { client_id: client.id, client_name: client.name, project_id: project.id, project_name: project.name, api_key: key.plaintext, created }
}
