import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'
import { runController } from '@/lib/controller/run'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/controller/run — run the controller now for this agency
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  try {
    // Service client: the run writes rows and reads price tables regardless of RLS
    const result = await runController(createServiceClient(), ctx.agencyId, ctx.via === 'session' ? 'manual' : 'mcp', new URL(req.url).origin)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
