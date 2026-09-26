import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { getMilestones } from '@/lib/onboarding'

// GET /api/onboarding — milestones derived from data
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  return NextResponse.json(await getMilestones(ctx.supabase, ctx.agencyId))
}

// POST /api/onboarding { dismissed: true|false } — hide or show the checklist
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  const { error } = await ctx.supabase
    .from('agencies')
    .update({ onboarding_dismissed_at: body.dismissed === false ? null : new Date().toISOString() })
    .eq('id', ctx.agencyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
