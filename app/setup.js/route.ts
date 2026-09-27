import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

// GET /setup.js — the keyone-cli installer, for hosts without npm:
//   curl -fsSL https://getkeyone.com/setup.js | node - setup
export async function GET() {
  const file = path.join(process.cwd(), 'cli', 'keyone.js')
  const body = fs.readFileSync(file, 'utf8')
  return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
