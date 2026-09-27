import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/health — liveness plus the deployed commit, so CI can wait for a deploy
export async function GET() {
  return NextResponse.json({
    ok: true,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null,
    env: process.env.VERCEL_ENV ?? 'local',
    time: new Date().toISOString(),
  })
}
