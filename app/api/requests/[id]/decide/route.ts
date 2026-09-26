import { createServiceClient } from '@/lib/supabase/server'
import { decideBudgetRequest } from '@/lib/requests'

export const runtime = 'nodejs'

// GET /api/requests/:id/decide?token=…&action=approve|deny
// Linked from the alert email. Single use; no login required.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? ''
  const action = url.searchParams.get('action') === 'deny' ? 'deny' : 'approve'

  try {
    const row = await decideBudgetRequest(createServiceClient(), params.id, action, 'email', { token, origin: url.origin })
    return page(
      action === 'approve' ? 'Budget approved' : 'Request denied',
      action === 'approve'
        ? `The project's monthly budget is now $${Number(row.requested_budget_usd).toFixed(2)}.`
        : 'The requester will see the request as denied.',
      `${url.origin}/dashboard/projects/${row.project_id}`
    )
  } catch (err) {
    return page('Nothing changed', err instanceof Error ? err.message : String(err), `${url.origin}/dashboard`, 400)
  }
}

function page(title: string, body: string, link: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title} · key.one</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F9F7F3;font-family:-apple-system,Segoe UI,sans-serif;color:#1a1a18">
<div style="max-width:440px;margin:80px auto;padding:32px;background:#fff;border:0.5px solid #e0ddd7;border-radius:12px">
<p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#888780;margin:0 0 8px">key.one</p>
<h1 style="font-size:24px;font-weight:500;margin:0 0 12px">${title}</h1>
<p style="color:#5F5E5A;line-height:1.5;margin:0 0 24px">${body}</p>
<a href="${link}" style="display:inline-block;background:#1a1a18;color:#F9F7F3;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">Open dashboard</a>
</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
