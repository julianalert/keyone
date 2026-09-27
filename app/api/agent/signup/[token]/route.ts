import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/agent/signup/:token — the agent polls until the human has clicked.
// The project key is returned exactly once, then wiped from the claim.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const service = createServiceClient()
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const { data: claim } = await service
    .from('agent_claims')
    .select('id, status, email, expires_at, project_key, project_id, agency_id, projects(name, clients(name))')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (!claim) return NextResponse.json({ error: 'Unknown claim' }, { status: 404 })

  if (claim.status === 'pending' && new Date(claim.expires_at).getTime() < Date.now()) {
    await service.from('agent_claims').update({ status: 'expired' }).eq('id', claim.id)
    return NextResponse.json({ status: 'expired', message: 'The approval link expired. Start again with POST /api/agent/signup.' }, { status: 410 })
  }
  if (claim.status === 'pending') {
    return NextResponse.json({ status: 'pending', message: `Waiting for ${claim.email} to click the approval email.` })
  }
  if (claim.status !== 'ready' || !claim.project_key) {
    return NextResponse.json({ status: claim.status, message: 'This claim was already collected.' })
  }

  // Hand the key over once
  const { data: taken } = await service
    .from('agent_claims')
    .update({ status: 'claimed', claimed_at: new Date().toISOString(), project_key: null })
    .eq('id', claim.id).eq('status', 'ready')
    .select('id').maybeSingle()
  if (!taken) return NextResponse.json({ status: 'claimed', message: 'This claim was already collected.' })

  const origin = appUrl(new URL(req.url).origin)
  const project = claim.projects as unknown as { name: string; clients: { name: string } | null } | null
  return NextResponse.json({
    status: 'ready',
    project_key: claim.project_key,
    project: { id: claim.project_id, name: project?.name ?? 'Default', client: project?.clients?.name ?? 'Sandbox' },
    env: {
      KEYONE_API_KEY: claim.project_key,
      KEYONE_OPENAI_BASE_URL: `${origin}/api/proxy/openai/v1`,
      KEYONE_ANTHROPIC_BASE_URL: `${origin}/api/proxy/anthropic`,
      KEYONE_PERPLEXITY_BASE_URL: `${origin}/api/proxy/perplexity`,
    },
    message: 'Write env to the project\'s env file (never to chat), then run: npx keyone-cli setup',
  })
}
