import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { appUrl, fromEmail, apiPaused } from '@/lib/config'

export const runtime = 'nodejs'

// POST /api/agent/signup { email, agent?: "Claude Code" }
//
// An agent starts the signup on the user's behalf. We email the user a
// one-click approval link; when they click it, the account exists (or is
// signed in), a Sandbox project is created, and its key is parked on the
// claim for the agent to collect once via GET /api/agent/signup/:token.
// The human consents with the click; the agent never sees a password and
// the key never goes through a chat.
export async function POST(req: NextRequest) {
  const paused = apiPaused()
  if (paused) return paused
  const body = await req.json().catch(() => ({})) as { email?: unknown; agent?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const agent = typeof body.agent === 'string' ? body.agent.trim().slice(0, 60) : null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

  const service = createServiceClient()

  // At most three approval emails per address per hour
  const { count } = await service
    .from('agent_claims').select('id', { count: 'exact', head: true })
    .eq('email', email).gte('created_at', new Date(Date.now() - 3600_000).toISOString())
  if ((count ?? 0) >= 3) return NextResponse.json({ error: 'Too many requests for this email. Try again in an hour.' }, { status: 429 })

  const origin = appUrl(new URL(req.url).origin)
  const token = randomBytes(24).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const { data: claim, error } = await service
    .from('agent_claims').insert({ token_hash: tokenHash, email, agent_label: agent }).select('id').single()
  if (error || !claim) return NextResponse.json({ error: error?.message ?? 'Could not start the signup' }, { status: 500 })

  // Magic link for existing users; for new ones the same call creates the
  // account with via=agent so the signup trigger marks the agency as agent-sourced.
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(`/onboarding?claim=${token}`)}`
  let link = await service.auth.admin.generateLink({
    type: 'magiclink', email, options: { redirectTo, data: { via: 'agent', agency_name: email.split('@')[0] } },
  })
  if (link.error && /not found|does not exist/i.test(link.error.message)) {
    link = await service.auth.admin.generateLink({
      type: 'invite', email, options: { redirectTo, data: { via: 'agent', agency_name: email.split('@')[0] } },
    })
  }
  if (link.error || !link.data.properties?.hashed_token) {
    return NextResponse.json({ error: link.error?.message ?? 'Could not create the sign-in link' }, { status: 500 })
  }
  const verifyType = link.data.properties.verification_type === 'invite' ? 'invite' : 'magiclink'
  const approveUrl = `${origin}/auth/callback?token_hash=${link.data.properties.hashed_token}&type=${verifyType}&next=${encodeURIComponent(`/onboarding?claim=${token}`)}`

  const resendKey = process.env.RESEND_API_KEY ?? ''
  if (!resendKey.startsWith('re_') || resendKey === 're_...') {
    return NextResponse.json({ error: 'Email is not configured on this instance' }, { status: 503 })
  }
  try {
    await new Resend(resendKey).emails.send({
      from: fromEmail('alerts'),
      to: email,
      subject: `${agent ?? 'Your agent'} wants to connect key.one`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;line-height:1.5">
        <h2 style="font-size:20px;font-weight:500">${escape(agent ?? 'Your coding agent')} asked to set up key.one for you</h2>
        <p style="color:#5F5E5A">One click creates your key.one account (or signs you in), with a <strong>Sandbox</strong> project capped at $${'10'} a month and $3 of free credit. Your agent picks up the project key by itself; you never paste it anywhere.</p>
        <a href="${approveUrl}" style="display:inline-block;margin-top:8px;background:#1a1a18;color:#F9F7F3;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">Approve and open key.one</a>
        <p style="margin-top:20px;font-size:12px;color:#888780">This link expires in 30 minutes. If you didn't ask an agent to set up key.one, ignore this email and nothing happens.</p>
      </div>`,
    })
  } catch (err) {
    return NextResponse.json({ error: `Could not send the email: ${String(err)}` }, { status: 502 })
  }

  return NextResponse.json({
    status: 'pending',
    claim_token: token,
    poll_url: `${origin}/api/agent/signup/${token}`,
    expires_in_seconds: 1800,
    message: `Approval email sent to ${email}. Ask the user to click the link, then poll poll_url every 5 seconds until status is "ready".`,
  }, { status: 202 })
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c))
}
