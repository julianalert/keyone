import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { fromEmail } from '@/lib/config'

export interface AlertInput {
  agency_id: string
  kind: 'budget_threshold' | 'key_frozen' | 'budget_request' | 'budget_decided' | 'controller_digest' | 'wallet_topup' | 'low_balance'
  scope: 'project' | 'client' | 'key' | 'request' | 'agency'
  scope_id: string
  dedupe_key?: string
  title: string
  body?: string
  data?: Record<string, unknown>
}

interface AgencyNotifyRow {
  name: string
  alert_email: string | null
  webhook_url: string | null
  owner: { email: string } | null
}

function resendConfigured(): boolean {
  const k = process.env.RESEND_API_KEY ?? ''
  return k.startsWith('re_') && k !== 're_...'
}

// Record an alert (deduped) and deliver it by email and webhook when
// configured. Returns null when the dedupe key already exists.
export async function raiseAlert(supabase: SupabaseClient, input: AlertInput): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('alerts')
    .insert({ ...input, dedupe_key: input.dedupe_key ?? null })
    .select('id')
    .maybeSingle()
  if (error || !row) return null   // unique violation = already alerted this period

  const { data } = await supabase
    .from('agencies')
    .select('name, alert_email, webhook_url, owner:users!agencies_owner_user_id_fkey(email)')
    .eq('id', input.agency_id)
    .single()
  const agency = data as unknown as AgencyNotifyRow | null
  if (!agency) return row.id

  const email = agency.alert_email ?? agency.owner?.email ?? null
  const delivered = { delivered_email: false, delivered_webhook: false }

  if (email && resendConfigured()) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: fromEmail('alerts'),
        to: email,
        subject: input.title,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18">
          <h2 style="font-size:18px;font-weight:500">${escapeHtml(input.title)}</h2>
          <p style="color:#5F5E5A;white-space:pre-line">${escapeHtml(input.body ?? '')}</p>
          ${linkButtons(input.data)}
          <p style="margin-top:24px;font-size:12px;color:#888780">key.one · ${escapeHtml(agency.name)}</p>
        </div>`,
      })
      delivered.delivered_email = true
    } catch (err) {
      console.error('[notify] email failed:', err)
    }
  }

  if (agency.webhook_url) {
    try {
      const res = await fetch(agency.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'keyone-alerts/1.0' },
        body: JSON.stringify({ id: row.id, ...input, created_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      })
      delivered.delivered_webhook = res.ok
    } catch (err) {
      console.error('[notify] webhook failed:', err)
    }
  }

  await supabase.from('alerts').update(delivered).eq('id', row.id)
  return row.id
}

function linkButtons(data?: Record<string, unknown>): string {
  const links = (data?.links ?? {}) as Record<string, string>
  return Object.entries(links)
    .map(([label, href]) =>
      `<a href="${escapeHtml(href)}" style="display:inline-block;margin:12px 8px 0 0;background:#1a1a18;color:#F9F7F3;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">${escapeHtml(label)}</a>`)
    .join('')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
