import { redirect } from 'next/navigation'
import { createHash } from 'node:crypto'
import { getSessionContext } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'
import { ensureSandbox } from '@/lib/onboarding'
import { FirstRun, type FirstRunProject } from '@/components/onboarding/FirstRun'

export const dynamic = 'force-dynamic'

// /onboarding — the welcome screen.
//   Human path: name a client and a project, then skill line, key, try it out.
//   Agent path (?claim=… from an agent-initiated signup, or an agency created
//   through the skill's signup link): a Sandbox project exists already and the
//   key comes first; with a claim, the agent collects the key by itself.
export default async function OnboardingPage({ searchParams }: { searchParams?: { claim?: string } }) {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  const service = createServiceClient()

  const { data: agency } = await service.from('agencies').select('name, onboarding_source').eq('id', ctx.agencyId).single()
  const agencyName = agency?.name ?? 'your agency'
  let mode: 'human' | 'agent' = agency?.onboarding_source === 'agent' ? 'agent' : 'human'
  let project: FirstRunProject | null = null

  const claimToken = searchParams?.claim
  if (claimToken) {
    // The human clicked the approval email: fulfil the agent's claim
    const tokenHash = createHash('sha256').update(claimToken).digest('hex')
    const { data: claim } = await service
      .from('agent_claims').select('id, email, status, expires_at').eq('token_hash', tokenHash).maybeSingle()
    const { data: { user } } = await ctx.supabase.auth.getUser()
    const fresh = claim && claim.status === 'pending' && new Date(claim.expires_at).getTime() > Date.now()
    if (fresh && user?.email && user.email.toLowerCase() === claim.email) {
      const sandbox = await ensureSandbox(service, ctx.agencyId)
      await service.from('agent_claims').update({
        status: 'ready', ready_at: new Date().toISOString(), agency_id: ctx.agencyId, project_id: sandbox.project_id, project_key: sandbox.api_key,
      }).eq('id', claim.id)
      await service.from('agencies').update({ onboarding_source: 'agent' }).eq('id', ctx.agencyId)
      mode = 'agent'
      project = { clientName: sandbox.client_name, projectName: sandbox.project_name, projectId: sandbox.project_id, apiKey: sandbox.api_key, deliveredToAgent: true }
    }
  }

  if (!project) {
    // An existing project (returning visit, or an agent-sourced agency): show it without a key
    const { data: existing } = await service
      .from('projects').select('id, name, clients(name)').eq('agency_id', ctx.agencyId).order('created_at', { ascending: true }).limit(1).maybeSingle()
    if (existing) {
      const client = existing.clients as unknown as { name: string } | null
      project = { clientName: client?.name ?? '', projectName: existing.name, projectId: existing.id, apiKey: null }
    } else if (mode === 'agent') {
      // Came in through the skill's signup link: create the sandbox now and show its key once
      const sandbox = await ensureSandbox(service, ctx.agencyId)
      project = { clientName: sandbox.client_name, projectName: sandbox.project_name, projectId: sandbox.project_id, apiKey: sandbox.api_key }
    }
  }

  return <FirstRun mode={mode} agencyName={agencyName} project={project} />
}
